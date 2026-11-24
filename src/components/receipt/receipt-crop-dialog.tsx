"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type CroppedReceiptImage,
  openReceiptPhoto,
  paintReceiptBitmap,
  prepareReceiptImage,
  receiptCanvasSize,
} from "@/lib/receipt-image";
import { Loader2, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const fullPhoto: PercentCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

/** Lets the user choose the only part of the original photo that can be sent. */
export function ReceiptCropDialog({
  file,
  onCancel,
  onRead,
  onCloseFocus,
}: {
  file: File;
  onCancel: () => void;
  onRead: (prepared: CroppedReceiptImage) => void;
  onCloseFocus: () => void;
}) {
  const { t } = useTranslation();
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [crop, setCrop] = useState(fullPhoto);
  const [turns, setTurns] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const pending = useRef<AbortController | null>(null);

  const size = bitmap ? receiptCanvasSize(bitmap, turns) : null;
  const canRead = bitmap && crop.width > 0 && crop.height > 0 && !preparing;

  useEffect(() => {
    let active = true;
    let decoded: ImageBitmap | undefined;
    openReceiptPhoto(file).then(
      (image) => {
        if (!active) {
          image.close();
          return;
        }
        decoded = image;
        setBitmap(image);
      },
      () => {
        if (active) setHasError(true);
      },
    );
    return () => {
      active = false;
      pending.current?.abort();
      decoded?.close();
    };
  }, [file]);

  useEffect(() => {
    if (!bitmap || !preview.current) return;
    try {
      paintReceiptBitmap(preview.current, bitmap, turns);
    } catch {
      setBitmap(null);
      setHasError(true);
    }
  }, [bitmap, turns]);

  function rotate() {
    setTurns((turns) => (turns + 1) % 4);
    setCrop(({ x, y, width, height }) => ({
      unit: "%",
      x: Math.max(0, 100 - y - height),
      y: x,
      width: height,
      height: width,
    }));
  }

  function cancel() {
    pending.current?.abort();
    onCancel();
  }

  async function read() {
    if (!canRead || pending.current) return;
    const attempt = new AbortController();
    pending.current = attempt;
    setPreparing(true);
    setHasError(false);
    try {
      const prepared = await prepareReceiptImage(bitmap, crop, turns);
      if (!attempt.signal.aborted) onRead(prepared);
    } catch {
      if (!attempt.signal.aborted) setHasError(true);
    } finally {
      if (!attempt.signal.aborted) setPreparing(false);
      pending.current = null;
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onCloseFocus();
        }}
      >
        <DialogHeader className="pr-7 text-left">
          <DialogTitle>{t("receipt.cropTitle")}</DialogTitle>
          <DialogDescription>{t("receipt.cropHint")}</DialogDescription>
        </DialogHeader>
        {size ? (
          <div className="flex justify-center rounded-md bg-muted p-3">
            <ReactCrop
              ariaLabels={{
                cropArea: t("receipt.cropArea"),
                nwDragHandle: t("receipt.cropHandles.topLeft"),
                nDragHandle: t("receipt.cropHandles.top"),
                neDragHandle: t("receipt.cropHandles.topRight"),
                eDragHandle: t("receipt.cropHandles.right"),
                seDragHandle: t("receipt.cropHandles.bottomRight"),
                sDragHandle: t("receipt.cropHandles.bottom"),
                swDragHandle: t("receipt.cropHandles.bottomLeft"),
                wDragHandle: t("receipt.cropHandles.left"),
              }}
              className="[--rc-focus-color:var(--ring)]"
              crop={crop}
              disabled={preparing}
              keepSelection
              onChange={(_, selection) => setCrop(selection)}
              style={{
                width: `min(100%, ${size.width}px, ${(size.width / size.height) * 52}dvh)`,
              }}
            >
              <canvas
                ref={preview}
                {...size}
                className="block h-auto w-full touch-none"
              />
            </ReactCrop>
          </div>
        ) : hasError ? null : (
          <output className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("receipt.openingPhoto")}
          </output>
        )}
        {hasError && (
          <p role="alert" className="text-sm text-destructive">
            {t("receipt.badImage")}
          </p>
        )}
        <DialogFooter className="flex-row flex-wrap justify-end gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            disabled={!bitmap || preparing}
            onClick={rotate}
          >
            <RotateCw aria-hidden="true" data-icon="inline-start" />
            {t("receipt.rotate")}
          </Button>
          <Button type="button" variant="outline" onClick={cancel}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!canRead}
            onClick={() => {
              void read();
            }}
          >
            {preparing && (
              <Loader2
                className="animate-spin"
                aria-hidden="true"
                data-icon="inline-start"
              />
            )}
            {t("receipt.readCrop")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
