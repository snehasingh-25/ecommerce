import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { IMAGE_CONFIG } from "../config/images.js";

dotenv.config();

let cloudinaryConfigured = false;

function initCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    const url = process.env.CLOUDINARY_URL;
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      cloudinary.config({
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3],
      });
      cloudinaryConfigured = true;
      return;
    }
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
}

initCloudinary();

export function assertCloudinaryConfigured() {
  if (!cloudinaryConfigured) {
    throw new Error(
      "CLOUDINARY_URL is required for product image uploads. Configure Cloudinary in your environment."
    );
  }
}

export function isCloudinaryConfigured() {
  return cloudinaryConfigured;
}

function buildTransform({ width, crop = IMAGE_CONFIG.delivery.crop }) {
  const transform = {
    fetch_format: IMAGE_CONFIG.delivery.fetchFormat,
    quality: IMAGE_CONFIG.delivery.quality,
  };

  if (width) {
    transform.width = width;
    transform.crop = crop;
  }

  return transform;
}

/**
 * Build a Cloudinary delivery URL with f_auto, q_auto, width, and c_fill.
 */
export function buildCloudinaryDeliveryUrl(publicId, width, { crop } = {}) {
  assertCloudinaryConfigured();

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [buildTransform({ width, crop })],
  });
}

/**
 * Inject delivery transforms into an existing Cloudinary URL string.
 */
export function injectCloudinaryTransforms(url, width = IMAGE_CONFIG.delivery.defaultWidth) {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const marker = "/image/upload/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return url;

  const prefix = url.slice(0, markerIndex + marker.length);
  const rest = url.slice(markerIndex + marker.length);
  const slashIndex = rest.indexOf("/");
  const firstSegment = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
  const afterFirstSegment = slashIndex === -1 ? "" : rest.slice(slashIndex + 1);
  if (firstSegment.includes("f_auto")) return url;

  const transform = `f_auto,q_auto,w_${width},c_${IMAGE_CONFIG.delivery.crop}`;

  if (firstSegment.includes(",")) {
    return `${prefix}${transform}${afterFirstSegment ? `/${afterFirstSegment}` : ""}`;
  }

  return `${prefix}${transform}/${rest}`;
}

/**
 * Upload a WebP buffer to Cloudinary.
 */
export function uploadWebpBuffer(buffer, { publicId, folder = IMAGE_CONFIG.cloudinaryFolder }) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        format: "webp",
        folder,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Build responsive delivery URLs from a stored Cloudinary asset.
 */
export function buildVariantUrls(publicId, secureUrl) {
  assertCloudinaryConfigured();

  return {
    thumb: buildCloudinaryDeliveryUrl(publicId, IMAGE_CONFIG.variants.thumb),
    medium: buildCloudinaryDeliveryUrl(publicId, IMAGE_CONFIG.variants.medium),
    large: buildCloudinaryDeliveryUrl(publicId, IMAGE_CONFIG.variants.large),
    original: buildCloudinaryDeliveryUrl(publicId, IMAGE_CONFIG.maxLongEdge, { crop: "limit" }),
  };
}

/**
 * Remove a product image from Cloudinary.
 */
export async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;
  if (!cloudinaryConfigured) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    console.info(`[cloudinaryStorage] Deleted: ${publicId}`);
  } catch (error) {
    console.error(`[cloudinaryStorage] Failed to delete ${publicId}:`, error.message);
  }
}
