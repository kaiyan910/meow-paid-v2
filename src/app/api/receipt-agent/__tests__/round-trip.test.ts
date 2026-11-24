import { POST } from "@/app/api/receipt-agent/route";
import { runReceiptTurn } from "@/lib/receipt-client";
import type { ReceiptMessage } from "@/store/receipt.store";
// @vitest-environment node
import { NextRequest } from "next/server";
import sharp from "sharp";
import { afterEach, expect, it, vi } from "vitest";

const payer = "00000000-0000-4000-8000-000000000001";
const shop = "00000000-0000-4000-8000-000000000002";
const food = "00000000-0000-4000-8000-000000000003";
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/supabase", () => ({
  getVerifiedUserId: async () => payer,
  createRequestSession: () => ({
    supabase: { from: mocks.from },
    respond: (response: Response) => response,
  }),
}));

const draft = {
  shopId: shop,
  newShop: null,
  date: "2026-11-24",
  discount: "0",
  paidTotal: "12.35",
  lines: [{ label: "Tea", amount: "12.35", subtypeId: food }],
};

function modelResponse(
  output: string | Array<{ name: string; args: unknown }>,
  pause?: Promise<void>,
) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        const send = (delta: object, finishReason: string | null = null) => {
          const chunk = {
            id: "test-completion",
            object: "chat.completion.chunk",
            created: 1,
            model: "test/model",
            choices: [{ index: 0, finish_reason: finishReason, delta }],
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
        };
        send({ role: "assistant" });
        if (typeof output === "string") {
          const split = pause ? output.indexOf("\\udc31") : output.length;
          send({ content: output.slice(0, split) });
          if (pause) {
            await pause;
            send({ content: output.slice(split) });
          }
        } else {
          send({
            tool_calls: output.map(({ name, args }, index) => ({
              index,
              id: `call_${index}`,
              type: "function",
              function: { name, arguments: JSON.stringify(args) },
            })),
          });
        }
        send({}, typeof output === "string" ? "stop" : "tool_calls");
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("streams the receipt reply before the draft is complete and applies later corrections without re-uploading the image", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("OPENROUTER_RECEIPT_MODEL", "test/model");
  vi.stubEnv("LANGSMITH_TRACING", "true");
  mocks.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      order: () => query,
      range: () => query,
      ilike: () => query,
      abortSignal: async () => ({
        data:
          table === "shops"
            ? [{ id: shop, name: "Market" }]
            : [{ id: food, name: "Food" }],
        error: null,
      }),
    };
    return query;
  });
  const modelRequests: string[] = [];
  const requestBodies: string[] = [];
  let releaseDraft: (() => void) | undefined;
  const remainingDraft = new Promise<void>((resolve) => {
    releaseDraft = resolve;
  });
  vi.stubGlobal("fetch", async (resource: string, init: RequestInit) => {
    if (resource === "/api/receipt-agent") {
      requestBodies.push(String(init.body));
      return POST(
        new NextRequest(`http://localhost${resource}`, {
          ...init,
          signal: init.signal ?? undefined,
        }),
      );
    }
    expect(resource).toBe("https://openrouter.ai/api/v1/chat/completions");
    modelRequests.push(String(init.body));
    const payload = JSON.parse(String(init.body)) as {
      stream: boolean;
      tools: Array<{ function: { name: string } }>;
    };
    expect(payload.stream).toBe(true);
    expect(payload.tools.map(({ function: { name } }) => name)).toEqual([
      "list_shops",
      "list_payment_subtypes",
      "list_shop_categories",
    ]);
    if (modelRequests.length === 1) {
      return modelResponse([
        { name: "list_shops", args: { search: "Market", offset: 0 } },
        { name: "list_payment_subtypes", args: { search: null, offset: 0 } },
      ]);
    }
    if (modelRequests.length === 2) {
      return modelResponse(
        JSON.stringify({ reply: '收據 "茶" 🐱。', draft }).replace(
          "🐱",
          "\\ud83d\\udc31",
        ),
        remainingDraft,
      );
    }
    return modelResponse(
      JSON.stringify({
        draft: { ...draft, date: "2026-11-25" },
        reply: "Updated the receipt date.",
      }),
    );
  });

  const threadId = crypto.randomUUID();
  const image = {
    mimeType: "image/png",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMHsAAAAASUVORK5CYII=",
  } as const;
  const upload: ReceiptMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: "Read my receipt",
  };
  const onReply = vi.fn();
  const firstRun = runReceiptTurn({
    threadId,
    history: [],
    message: upload,
    image,
    draft: null,
    locale: "en",
    abortController: new AbortController(),
    onReply,
  });
  void firstRun.catch(() => undefined);
  try {
    await vi.waitFor(() =>
      expect(onReply).toHaveBeenCalledWith({
        id: expect.any(String),
        role: "assistant",
        text: '收據 "茶" ',
      }),
    );
  } finally {
    releaseDraft?.();
  }
  const first = await firstRun;
  expect(onReply.mock.calls.map(([reply]) => reply.text)).toEqual([
    '收據 "茶" ',
    '收據 "茶" 🐱。',
  ]);
  expect(onReply.mock.lastCall?.[0]).toEqual(first.reply);
  expect(first.state.viewerId).toBe(payer);
  expect(first.state.draft?.shopId).toBe(shop);
  expect(first.state.draft?.lines[0].subtypeId).toBe(food);
  expect(mocks.from.mock.calls.map(([table]) => table)).toEqual([
    "shops",
    "payment_subtypes",
  ]);
  expect(modelRequests[0]).toContain(`data:image/png;base64,${image.data}`);

  const change: ReceiptMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: "The date should be November 25",
  };
  const edited = await runReceiptTurn({
    threadId,
    history: [upload, first.reply],
    message: change,
    draft: first.state.draft,
    locale: "en",
    abortController: new AbortController(),
  });
  expect(edited.state.draft?.date).toBe("2026-11-25");
  expect(edited.reply.text).toBe("Updated the receipt date.");
  expect(requestBodies[1]).not.toContain(image.data);
  expect(modelRequests[2]).not.toContain(image.data);
});

it("reports a failed run when the draft JSON is cut off after the reply", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("OPENROUTER_RECEIPT_MODEL", "test/model");
  vi.stubGlobal("fetch", async (resource: string, init: RequestInit) => {
    if (resource === "/api/receipt-agent")
      return POST(
        new NextRequest(`http://localhost${resource}`, {
          ...init,
          signal: init.signal ?? undefined,
        }),
      );
    expect(resource).toBe("https://openrouter.ai/api/v1/chat/completions");
    return modelResponse('{"reply":"Here is the updated draft.","draft":');
  });

  const onReply = vi.fn();
  await expect(
    runReceiptTurn({
      threadId: crypto.randomUUID(),
      history: [],
      message: {
        id: crypto.randomUUID(),
        role: "user",
        text: "Update the draft",
      },
      draft: null,
      locale: "en",
      abortController: new AbortController(),
      onReply,
    }),
  ).rejects.toThrow("receipt_run_failed");
  expect(onReply).toHaveBeenCalledWith({
    id: expect.any(String),
    role: "assistant",
    text: "Here is the updated draft.",
  });
});

it.each([
  [1001, 40],
  [40, 1001],
])(
  "rejects a %i × %i receipt image before contacting OpenRouter",
  async (width, height) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const image = await sharp({
      create: { width, height, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const response = await POST(
      new NextRequest("http://localhost/api/receipt-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-meowpaid": "1" },
        body: JSON.stringify({
          threadId: crypto.randomUUID(),
          runId: crypto.randomUUID(),
          state: { draft: null, locale: "en" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Read this receipt" },
                {
                  type: "image",
                  source: {
                    type: "data",
                    mimeType: "image/png",
                    value: image.toString("base64"),
                  },
                },
              ],
            },
          ],
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  },
);
