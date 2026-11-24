import "@/i18n";
import type { runReceiptTurn } from "@/lib/receipt-client";
import { openReceiptPhoto, prepareReceiptImage } from "@/lib/receipt-image";
import { ReceiptAssistantPage } from "@/screens/receipt-assistant-page";
import type { ReceiptSessionStore } from "@/store/receipt.store";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useStore } from "zustand";

const { recognize } = vi.hoisted(() => ({
  recognize: vi.fn<typeof runReceiptTurn>(),
}));

vi.mock("@/lib/receipt-client", async (load) => ({
  ...(await load<typeof import("@/lib/receipt-client")>()),
  runReceiptTurn: recognize,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/hooks/use-transactions", () => ({
  useConfirmReceipt: () => ({ reset: vi.fn(), isPending: false }),
}));
vi.mock("@/components/receipt/receipt-review", () => ({
  ReceiptReview: ({ store }: { store: ReceiptSessionStore }) => {
    const date = useStore(store, (state) => state.draft?.date);
    return date ? <p>Draft for {date}</p> : null;
  },
}));

const encodedSizes: number[][] = [];
const drawImage = vi.fn();

beforeEach(() => {
  encodedSizes.length = 0;
  recognize.mockReset();
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(
      async (
        _source: File | ImageBitmap,
        _x?: number | ImageBitmapOptions,
        _y?: number,
        width = 1200,
        height = 3000,
      ) => ({ width, height, close: vi.fn() }),
    ),
  );
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:cropped-receipt");
      static revokeObjectURL = vi.fn();
    },
  );
  const context = {
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage,
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
  ) {
    encodedSizes.push([this.width, this.height]);
    callback(new Blob(["cropped image"], { type: "image/jpeg" }));
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function recognized(date: string): Awaited<ReturnType<typeof runReceiptTurn>> {
  return {
    state: {
      locale: "en",
      viewerId: "00000000-0000-4000-8000-000000000001",
      draft: {
        shopId: null,
        newShop: null,
        date,
        discount: "0",
        paidTotal: "0",
        lines: [],
      },
    },
    reply: { id: date, role: "assistant", text: "Review your receipt." },
  };
}

it("uploads the cropped receipt and replaces the waiting text in the same reply bubble", async () => {
  const user = userEvent.setup();
  const result = recognized("2026-11-24");
  let finish:
    | ((result: Awaited<ReturnType<typeof runReceiptTurn>>) => void)
    | undefined;
  let startReply: (() => void) | undefined;
  const completion = new Promise<typeof result>((resolve) => {
    finish = resolve;
  });
  recognize.mockImplementation(({ onReply }) => {
    startReply = () => onReply?.({ ...result.reply, text: "Review your" });
    return completion;
  });
  render(<ReceiptAssistantPage />);

  await user.upload(
    screen.getByLabelText("Choose receipt photo"),
    new File(["original"], "receipt.png", { type: "image/png" }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Crop receipt" }),
  ).toBeVisible();
  expect(recognize).not.toHaveBeenCalled();
  expect(encodedSizes).toEqual([]);
  await user.click(screen.getByRole("button", { name: "Rotate 90°" }));
  expect(recognize).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Read receipt" }));
  const waiting = await screen.findByText("Reviewing your receipt");
  const replyBubble = waiting.closest("li");
  expect(replyBubble).toHaveTextContent("Reviewing your receipt...");
  await act(async () => startReply?.());
  expect(screen.getByText("Review your").closest("li")).toBe(replyBubble);
  expect(waiting).not.toBeInTheDocument();
  expect(screen.queryByText("Draft for 2026-11-24")).not.toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Message to the receipt assistant" }),
  ).toBeDisabled();
  await act(async () => finish?.(result));
  expect(screen.getByText(result.reply.text).closest("li")).toBe(replyBubble);
  expect(await screen.findByText("Draft for 2026-11-24")).toBeVisible();
  expect(encodedSizes).toEqual([[1000, 400]]);
  expect(recognize).toHaveBeenCalledOnce();
  expect(recognize.mock.calls[0][0].image).toEqual({
    mimeType: "image/jpeg",
    data: btoa("cropped image"),
  });
});

it("isolates the selected source rectangle before rotating and keeps a smaller crop at its original size", async () => {
  const photo = await openReceiptPhoto(
    new File(["original"], "receipt.png", { type: "image/png" }),
  );
  await prepareReceiptImage(
    photo,
    { unit: "%", x: 25, y: 0, width: 25, height: 50 },
    1,
  );
  expect(createImageBitmap).toHaveBeenLastCalledWith(photo, 0, 1500, 600, 750);
  expect(encodedSizes).toEqual([[750, 600]]);
});

it("keeps the old draft through a cancelled or failed replacement and retries the local crop", async () => {
  const user = userEvent.setup();
  let fail: ((reason: Error) => void) | undefined;
  const failedRun = new Promise<Awaited<ReturnType<typeof runReceiptTurn>>>(
    (_, reject) => {
      fail = reject;
    },
  );
  recognize
    .mockResolvedValueOnce(recognized("2026-11-24"))
    .mockImplementationOnce(({ onReply }) => {
      onReply?.({
        id: "unfinished",
        role: "assistant",
        text: "Reading the replacement",
      });
      return failedRun;
    })
    .mockResolvedValueOnce(recognized("2026-11-25"));
  render(<ReceiptAssistantPage />);
  const picker = screen.getByLabelText("Choose receipt photo");
  await user.upload(
    picker,
    new File(["original"], "original.png", { type: "image/png" }),
  );
  await user.click(await screen.findByRole("button", { name: "Read receipt" }));
  expect(await screen.findByText("Draft for 2026-11-24")).toBeVisible();

  const replacement = new File(["replacement"], "new.png", {
    type: "image/png",
  });
  await user.upload(picker, replacement);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Draft for 2026-11-24")).toBeVisible();
  expect(recognize).toHaveBeenCalledOnce();

  await user.upload(picker, replacement);
  await user.click(await screen.findByRole("button", { name: "Read receipt" }));
  expect(await screen.findByText("Reading the replacement")).toBeVisible();
  expect(screen.getByText("Draft for 2026-11-24")).toBeVisible();
  await act(async () => fail?.(new Error("connection lost")));
  const retry = await screen.findByRole("button", {
    name: "Retry reading new.png",
  });
  expect(screen.queryByText("Reading the replacement")).not.toBeInTheDocument();
  expect(screen.getByText("Draft for 2026-11-24")).toBeVisible();
  await user.click(retry);
  expect(await screen.findByText("Draft for 2026-11-25")).toBeVisible();
  await waitFor(() =>
    expect(screen.queryByText("Draft for 2026-11-24")).toBeNull(),
  );
  expect(encodedSizes).toEqual([
    [400, 1000],
    [400, 1000],
  ]);
  const [, [failed], [retried]] = recognize.mock.calls;
  expect(failed.image).toBe(retried.image);
  expect(failed.history).toEqual([]);
  expect(retried.history).toEqual([]);
});
