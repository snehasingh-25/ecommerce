import sharp from "sharp";
import fs from "fs";
import { IMAGE_CONFIG } from "../config/images.js";
import {
  uploadWebpBuffer,
  buildVariantUrls,
  assertCloudinaryConfigured,
} from "./cloudinaryStorage.js";

function makeImageId() {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function buildResizedPipeline(inputBuffer, metadata, targetWidth) {
  const { width = 1, height = 1 } = metadata;
  const longEdge = Math.max(width, height);
  const effectiveWidth = Math.min(targetWidth, longEdge);

  if (longEdge <= effectiveWidth) {
    return sharp(inputBuffer, { failOn: "none" });
  }

  if (width >= height) {
    return sharp(inputBuffer, { failOn: "none" }).resize({
      width: effectiveWidth,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return sharp(inputBuffer, { failOn: "none" }).resize({
    height: effectiveWidth,
    fit: "inside",
    withoutEnlargement: true,
  });
}

/**
 * Encode WebP under a byte limit by stepping quality down, then slightly
 * reducing dimensions only as a last resort.
 */
async function encodeWebpUnderLimit(inputBuffer, metadata, targetWidth, maxBytes, label) {
  const { quality: startQ, effort, minQuality, qualityStep } = IMAGE_CONFIG.webp;
  let scale = 1;

  for (let dimAttempt = 0; dimAttempt < 8; dimAttempt++) {
    const scaledWidth = Math.max(1, Math.round(targetWidth * scale));
    const pipeline = buildResizedPipeline(inputBuffer, metadata, scaledWidth);

    for (let q = startQ; q >= minQuality; q -= qualityStep) {
      const buffer = await pipeline
        .clone()
        .webp({ quality: q, effort, smartSubsample: true })
        .toBuffer();

      if (buffer.length <= maxBytes) {
        return { buffer, quality: q, scale };
      }
    }

    scale *= 0.9;
  }

  throw new Error(
    `Could not optimize ${label} under ${Math.round(maxBytes / 1024)}KB after quality reduction`
  );
}

/**
 * Optimize a product image from a Multer temp file or existing file path.
 * Produces one WebP on Cloudinary; responsive sizes use transform URLs.
 */
export async function optimizeProductImage(filePath, options = {}) {
  assertCloudinaryConfigured();

  const { imageId = makeImageId(), mimeType } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Source image not found: ${filePath}`);
  }

  const inputBuffer = fs.readFileSync(filePath);
  const metadata = await sharp(inputBuffer, { failOn: "none" }).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }

  const { buffer, quality } = await encodeWebpUnderLimit(
    inputBuffer,
    metadata,
    IMAGE_CONFIG.maxLongEdge,
    IMAGE_CONFIG.maxBytes.original,
    "original"
  );

  const uploadResult = await uploadWebpBuffer(buffer, { publicId: imageId });
  const variants = buildVariantUrls(uploadResult.public_id, uploadResult.secure_url);

  const result = {
    id: imageId,
    publicId: uploadResult.public_id,
    canonical: uploadResult.secure_url,
    variants,
    width: metadata.width,
    height: metadata.height,
    sizeBytes: buffer.length,
    format: "webp",
    storage: "cloudinary",
    optimization: {
      quality,
      sizeBytes: buffer.length,
    },
  };

  if (mimeType) {
    result.sourceMime = mimeType;
  }

  console.info(
    `[imageOptimizer] Uploaded ${imageId} → Cloudinary ${Math.round(buffer.length / 1024)}KB ` +
      `(q=${quality}, ${metadata.width}x${metadata.height})`
  );

  return result;
}

export function validateProductImageMime(mimeType) {
  return IMAGE_CONFIG.allowedMimeTypes.includes(mimeType);
}

export { makeImageId };
