import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { IMAGE_CONFIG } from "../config/images.js";
import { deleteCloudinaryImage } from "./cloudinaryStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, "..");

export function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function parseImagesMeta(imagesMeta) {
  return parseJsonField(imagesMeta, []);
}

export function parseImages(images) {
  return parseJsonField(images, []);
}

/**
 * Build backward-compatible images array (large variant URLs).
 */
export function buildCompatImagesArray(imagesMeta) {
  if (!Array.isArray(imagesMeta) || imagesMeta.length === 0) return [];
  return imagesMeta.map((meta) => {
    if (meta?.variants?.large) return meta.variants.large;
    if (meta?.canonical) return meta.canonical;
    if (meta?.legacyUrl) return meta.legacyUrl;
    return null;
  }).filter(Boolean);
}

/**
 * Check if a URL belongs to an ImageMeta entry.
 */
export function metaMatchesUrl(meta, url) {
  if (!meta || !url) return false;
  if (meta.legacyUrl === url) return true;
  if (meta.canonical === url) return true;
  if (meta.variants) {
    return Object.values(meta.variants).includes(url);
  }
  return false;
}

export function findMetaByUrl(imagesMeta, url) {
  if (!url) return null;
  return imagesMeta.find((meta) => metaMatchesUrl(meta, url)) || null;
}

/**
 * Resolve final ordered image meta list from edit/create payload.
 */
export function resolveProductImagesMeta({
  existingImagesMeta = [],
  existingImages = [],
  imageOrder = null,
  newMetas = [],
}) {
  const ordered = imageOrder
    ? typeof imageOrder === "string"
      ? JSON.parse(imageOrder)
      : imageOrder
    : null;

  const legacyExisting = typeof existingImages === "string"
    ? JSON.parse(existingImages)
    : existingImages;

  const keptMetas = [];
  let newIndex = 0;

  if (Array.isArray(ordered) && ordered.length > 0) {
    for (const entry of ordered) {
      if (entry === "NEW") {
        if (newIndex < newMetas.length) {
          keptMetas.push(newMetas[newIndex]);
          newIndex++;
        }
      } else if (typeof entry === "string" && entry.length > 0) {
        const matched = findMetaByUrl(existingImagesMeta, entry);
        if (matched) {
          keptMetas.push(matched);
        } else {
          keptMetas.push({
            id: `legacy-${Buffer.from(entry).toString("base64url").slice(0, 16)}`,
            legacyUrl: entry,
            canonical: entry,
            variants: { thumb: entry, medium: entry, large: entry, original: entry },
            width: null,
            height: null,
            sizeBytes: null,
            format: "legacy",
          });
        }
      }
    }
    return keptMetas;
  }

  const base = Array.isArray(legacyExisting) ? legacyExisting : [];
  const legacyMetas = base.map((url) => {
    const matched = findMetaByUrl(existingImagesMeta, url);
    if (matched) return matched;
    return {
      id: `legacy-${Buffer.from(url).toString("base64url").slice(0, 16)}`,
      legacyUrl: url,
      canonical: url,
      variants: { thumb: url, medium: url, large: url, original: url },
      width: null,
      height: null,
      sizeBytes: null,
      format: "legacy",
    };
  });

  return [...legacyMetas, ...newMetas];
}

export function formatProductForApi(product) {
  const imagesMeta = parseImagesMeta(product.imagesMeta);
  const images = parseImages(product.images);

  return {
    ...product,
    images: images.length > 0 ? images : buildCompatImagesArray(imagesMeta),
    imagesMeta,
    videos: product.videos ? parseJsonField(product.videos, []) : [],
    instagramEmbeds: product.instagramEmbeds ? parseJsonField(product.instagramEmbeds, []) : [],
    keywords: product.keywords ? parseJsonField(product.keywords, []) : [],
    categories: product.categories
      ? product.categories.map((pc) => pc.category ?? pc)
      : undefined,
    occasions: product.occasions
      ? product.occasions.map((po) => po.occasion ?? po)
      : undefined,
    relations: product.relations
      ? product.relations.map((pr) => pr.relation ?? pr)
      : undefined,
  };
}

function absolutePathFromPublic(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return null;
  if (publicPath.startsWith("http")) return null;
  const rel = publicPath.replace(/^\//, "");
  return path.join(backendRoot, rel);
}

function deleteLocalImageFolderFromPath(absPath) {
  if (!absPath || !fs.existsSync(absPath)) return;

  const imageDir = absPath.includes(`${path.sep}backup${path.sep}`)
    ? path.dirname(path.dirname(absPath))
    : path.dirname(absPath);

  if (fs.existsSync(imageDir)) {
    fs.rmSync(imageDir, { recursive: true, force: true });
    console.info(`[productImageStorage] Deleted local image folder: ${imageDir}`);
  }
}

export async function deleteImageMetaFolder(meta) {
  if (!meta || meta.format === "legacy") return;

  if (meta.storage === "cloudinary" && meta.publicId) {
    await deleteCloudinaryImage(meta.publicId);
    return;
  }

  const candidates = [
    meta.canonical,
    ...(meta.variants ? Object.values(meta.variants) : []),
    meta.backup,
  ].filter(Boolean);

  for (const publicPath of candidates) {
    const abs = absolutePathFromPublic(publicPath);
    if (!abs) continue;
    deleteLocalImageFolderFromPath(abs);
    return;
  }
}

export async function deleteRemovedImages(oldMetas, newMetas) {
  const keptIds = new Set(newMetas.map((m) => m.id));
  for (const meta of oldMetas) {
    if (!keptIds.has(meta.id) && meta.format !== "legacy") {
      await deleteImageMetaFolder(meta);
    }
  }
}

export async function deleteAllProductImageFolders(productId, imagesMeta = []) {
  for (const meta of imagesMeta) {
    if (meta.storage === "cloudinary" && meta.publicId) {
      await deleteCloudinaryImage(meta.publicId);
    }
  }

  const productDir = path.join(backendRoot, IMAGE_CONFIG.productsDir, String(productId));
  if (fs.existsSync(productDir)) {
    fs.rmSync(productDir, { recursive: true, force: true });
    console.info(`[productImageStorage] Deleted legacy product image dir: ${productDir}`);
  }
}

export function getLocalFilePathFromUrl(url) {
  if (!url || !url.startsWith("/uploads/")) return null;
  return path.join(backendRoot, url.replace(/^\//, ""));
}

export function deleteLocalImageFromUrl(url) {
  const filePath = getLocalFilePathFromUrl(url);
  if (!filePath || !fs.existsSync(filePath)) return;

  if (filePath.includes(`${path.sep}${IMAGE_CONFIG.productsDir}${path.sep}`)) {
    deleteLocalImageFolderFromPath(filePath);
    return;
  }

  fs.unlinkSync(filePath);
  console.info(`[productImageStorage] Deleted local file: ${filePath}`);
}

export function isCloudinaryOptimizedMeta(meta) {
  return meta?.storage === "cloudinary" && meta?.format === "webp";
}
