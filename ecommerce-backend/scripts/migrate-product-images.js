/**
 * Migrate legacy product images to Cloudinary WebP storage.
 *
 * Handles:
 * - Local /uploads/ files (JPG, PNG, or existing local WebP variants)
 * - Existing Cloudinary JPG/PNG URLs
 * - Skips entries already on Cloudinary as WebP (storage: cloudinary)
 *
 * Usage:
 *   node scripts/migrate-product-images.js              # dry-run (default)
 *   node scripts/migrate-product-images.js --execute    # apply changes
 *   node scripts/migrate-product-images.js --execute --batch-size=10
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import prisma from "../prisma.js";
import { optimizeProductImage } from "../utils/imageOptimizer.js";
import {
  parseImages,
  parseImagesMeta,
  buildCompatImagesArray,
  getLocalFilePathFromUrl,
  metaMatchesUrl,
  deleteLocalImageFromUrl,
  isCloudinaryOptimizedMeta,
} from "../utils/productImageStorage.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_PATH = path.join(__dirname, "migration-log.json");

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const batchSizeArg = args.find((a) => a.startsWith("--batch-size="));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split("=")[1], 10) : 10;

function loadLog() {
  if (fs.existsSync(LOG_PATH)) {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  }
  return { migrations: [], startedAt: new Date().toISOString() };
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function classifyUrl(url) {
  if (!url || typeof url !== "string") return "invalid";
  if (url.includes("res.cloudinary.com")) return "cloudinary";
  if (url.startsWith("/uploads/")) return "local";
  if (url.startsWith("http")) return "external";
  return "other";
}

function isAlreadyMigrated(imagesMeta, url) {
  const matched = imagesMeta.find((meta) => metaMatchesUrl(meta, url));
  if (matched && isCloudinaryOptimizedMeta(matched)) return true;
  return imagesMeta.some(
    (meta) => metaMatchesUrl(meta, url) && isCloudinaryOptimizedMeta(meta)
  );
}

function resolveSourceFilePath(url, imagesMeta) {
  const matched = imagesMeta.find((meta) => metaMatchesUrl(meta, url));
  if (matched && isCloudinaryOptimizedMeta(matched)) return null;

  const localPath = getLocalFilePathFromUrl(url);
  if (localPath && fs.existsSync(localPath)) {
    if (localPath.endsWith(".webp") && localPath.includes("/products/")) {
      const originalPath = path.join(path.dirname(localPath), "original.webp");
      return fs.existsSync(originalPath) ? originalPath : localPath;
    }
    return localPath;
  }

  return null;
}

async function downloadUrlToTemp(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase() || "jpg";
  const tempPath = path.join(os.tmpdir(), `migrate-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function migrateImageUrl(url, product, imagesMeta) {
  if (isAlreadyMigrated(imagesMeta, url)) {
    return { status: "already_migrated", oldUrl: url };
  }

  const urlType = classifyUrl(url);
  let sourcePath = resolveSourceFilePath(url, imagesMeta);
  let tempPath = null;

  if (!sourcePath && (urlType === "cloudinary" || urlType === "external")) {
    if (!execute) {
      return { status: "dry_run", oldUrl: url, source: urlType, note: "will_download_and_reupload" };
    }
    tempPath = await downloadUrlToTemp(url);
    sourcePath = tempPath;
  }

  if (!sourcePath) {
    return { status: "skipped", oldUrl: url, reason: "file_not_found" };
  }

  const originalSize = fs.statSync(sourcePath).size;

  if (!execute) {
    return {
      status: "dry_run",
      oldUrl: url,
      source: urlType,
      originalSizeBytes: originalSize,
    };
  }

  try {
    const meta = await optimizeProductImage(sourcePath, {
      mimeType: `image/${path.extname(sourcePath).slice(1) === "png" ? "png" : "jpeg"}`,
    });

    if (urlType === "local") {
      deleteLocalImageFromUrl(url);
    }

    return {
      status: "migrated",
      oldUrl: url,
      newMeta: meta,
      originalSizeBytes: originalSize,
      optimizedSizeBytes: meta.sizeBytes,
      savedBytes: originalSize - (meta.sizeBytes || 0),
    };
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

async function migrateProduct(product, log) {
  const images = parseImages(product.images);
  const existingMeta = parseImagesMeta(product.imagesMeta);

  if (images.length === 0) return { skipped: true, reason: "no images" };

  const newMetas = [...existingMeta.filter((m) => isCloudinaryOptimizedMeta(m))];
  let changed = false;
  const productLog = {
    productId: product.id,
    name: product.name,
    images: [],
  };

  for (const url of images) {
    try {
      const result = await migrateImageUrl(url, product, existingMeta);
      productLog.images.push(result);

      if (result.status === "migrated") {
        const legacyIdx = newMetas.findIndex(
          (m) => m.legacyUrl === url || metaMatchesUrl(m, url)
        );
        if (legacyIdx >= 0) newMetas.splice(legacyIdx, 1);
        newMetas.push(result.newMeta);
        changed = true;
      } else if (result.status === "dry_run") {
        changed = true;
      }
    } catch (err) {
      productLog.images.push({
        oldUrl: url,
        status: "error",
        error: err.message,
      });
    }
  }

  if (changed && execute) {
    const compatImages = buildCompatImagesArray(newMetas);
    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: JSON.stringify(compatImages),
        imagesMeta: JSON.stringify(newMetas),
      },
    });
  }

  if (productLog.images.length > 0) {
    log.migrations.push(productLog);
  }

  return { changed, productLog };
}

async function main() {
  console.log(`=== Product Image Migration → Cloudinary (${execute ? "EXECUTE" : "DRY-RUN"}) ===`);

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true, imagesMeta: true },
    orderBy: { id: "asc" },
  });

  const log = loadLog();
  let processed = 0;
  let migrated = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    for (const product of batch) {
      const result = await migrateProduct(product, log);
      processed++;
      if (result.changed) migrated++;
      console.log(
        `[${processed}/${products.length}] Product #${product.id} — ${result.skipped ? "skipped" : result.changed ? "changed" : "unchanged"}`
      );
    }
  }

  log.completedAt = new Date().toISOString();
  log.mode = execute ? "execute" : "dry-run";
  log.stats = { processed, migrated };
  saveLog(log);

  console.log(`Done. Processed: ${processed}, Changed: ${migrated}`);
  console.log(`Log: ${LOG_PATH}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
