import { POST } from "@/app/api/receipt-agent/route";
import { runReceiptTurn } from "@/lib/receipt-client";
import type { ReceiptMessage } from "@/store/receipt.store";
// @vitest-environment node
import { NextRequest } from "next/server";
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

function modelResponse(calls: Array<{ name: string; args: unknown }>) {
  return Response.json({
    id: "test-completion",
    object: "chat.completion",
    created: 1,
    model: "test/model",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: calls.map(({ name, args }, index) => ({
            id: `call_${index}`,
            type: "function",
            function: { name, arguments: JSON.stringify(args) },
          })),
        },
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("reads one image, matches authenticated catalog entries, and applies a later chat correction without re-uploading it", async () => {
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
      tools: Array<{ function: { name: string } }>;
    };
    const responseTool = payload.tools.find(
      ({ function: { name } }) => !name.startsWith("list_"),
    );
    if (!responseTool) throw new Error("Missing structured response tool");
    if (modelRequests.length === 1) {
      return modelResponse([
        { name: "list_shops", args: { search: "Market", offset: 0 } },
        { name: "list_payment_subtypes", args: { search: null, offset: 0 } },
      ]);
    }
    return modelResponse([
      {
        name: responseTool.function.name,
        args:
          modelRequests.length === 2
            ? { reply: "Review your receipt.", draft }
            : {
                reply: "Updated the receipt date.",
                draft: { ...draft, date: "2026-11-25" },
              },
      },
    ]);
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
  const first = await runReceiptTurn({
    threadId,
    history: [],
    message: upload,
    image,
    draft: null,
    locale: "en",
    abortController: new AbortController(),
  });
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
