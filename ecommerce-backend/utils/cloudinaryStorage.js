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

const TRANSFORM_BASE = {
  crop: "limit",
  fetch_format: "webp",
  quality: "auto",
};

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

  const makeUrl = (width) =>
    cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width, ...TRANSFORM_BASE }],
    });

  return {
    thumb: makeUrl(IMAGE_CONFIG.variants.thumb),
    medium: makeUrl(IMAGE_CONFIG.variants.medium),
    large: makeUrl(IMAGE_CONFIG.variants.large),
    original: secureUrl,
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
