import {
  type ReceiptImage,
  receiptImageMaxBytes,
  receiptImageMaxDimension,
  receiptImageSchema,
} from "@/schemas/receipt.schema";
import type { PercentCrop } from "react-image-crop";

export type CroppedReceiptImage = { blob: Blob; image: ReceiptImage };

/** Decodes the original photo locally and respects the camera's EXIF orientation. */
export async function openReceiptPhoto(file: File) {
  if (!file.size || file.size > 24 * 1024 * 1024) {
    throw new Error("Invalid receipt photo size");
  }
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/** Fits the rotated image in the pixel limit while keeping its proportions. */
export function receiptCanvasSize(bitmap: ImageBitmap, quarterTurns: number) {
  const { width, height } = orientedSize(bitmap, quarterTurns);
  const scale = Math.min(1, receiptImageMaxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function orientedSize(bitmap: ImageBitmap, quarterTurns: number) {
  const { width, height } = bitmap;
  return quarterTurns % 2
    ? { width: height, height: width }
    : { width, height };
}

/** Draws an upright or rotated bitmap onto the preview or cropped output canvas. */
export function paintReceiptBitmap(
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
  quarterTurns: number,
) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Cannot render receipt photo");
  const { width, height } = orientedSize(bitmap, quarterTurns);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.imageSmoothingQuality = "high";
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(canvas.width / width, canvas.height / height);
  context.rotate((quarterTurns * Math.PI) / 2);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  context.restore();
}

/** Maps the visible crop back to the unrotated bitmap in whole source pixels. */
function sourceRectangle(
  bitmap: ImageBitmap,
  crop: PercentCrop,
  turns: number,
) {
  const { width, height } = orientedSize(bitmap, turns);
  const x = Math.max(0, Math.ceil((crop.x / 100) * width));
  const y = Math.max(0, Math.ceil((crop.y / 100) * height));
  const w =
    Math.min(width, Math.floor(((crop.x + crop.width) / 100) * width)) - x;
  const h =
    Math.min(height, Math.floor(((crop.y + crop.height) / 100) * height)) - y;
  if (w < 1 || h < 1) throw new Error("Empty receipt crop");

  switch (turns) {
    case 1:
      return { x: y, y: bitmap.height - x - w, width: h, height: w };
    case 2:
      return {
        x: bitmap.width - x - w,
        y: bitmap.height - y - h,
        width: w,
        height: h,
      };
    case 3:
      return { x: bitmap.width - y - h, y: x, width: h, height: w };
    default:
      return { x, y, width: w, height: h };
  }
}

/** Crops before resampling so only the selected rectangle contributes to the JPEG. */
export async function prepareReceiptImage(
  bitmap: ImageBitmap,
  crop: PercentCrop,
  quarterTurns: number,
): Promise<CroppedReceiptImage> {
  const { x, y, width, height } = sourceRectangle(bitmap, crop, quarterTurns);
  const cropped =
    width === bitmap.width && height === bitmap.height
      ? bitmap
      : await createImageBitmap(bitmap, x, y, width, height);
  const canvas = document.createElement("canvas");
  try {
    const size = receiptCanvasSize(cropped, quarterTurns);
    canvas.width = size.width;
    canvas.height = size.height;
    paintReceiptBitmap(canvas, cropped, quarterTurns);
  } finally {
    if (cropped !== bitmap) cropped.close();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Cannot encode receipt image")),
      "image/jpeg",
      0.92,
    );
  });
  if (blob.size > receiptImageMaxBytes)
    throw new Error("Receipt image too large");

  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Cannot read receipt image"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return {
    blob,
    image: receiptImageSchema.parse({
      mimeType: blob.type,
      data: url.split(",")[1],
    }),
  };
}
