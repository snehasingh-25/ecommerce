/**
 * Audit all product images before migration.
 * Usage: node scripts/audit-product-images.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import prisma from "../prisma.js";
import {
  parseImages,
  parseImagesMeta,
  getLocalFilePathFromUrl,
  isCloudinaryOptimizedMeta,
} from "../utils/productImageStorage.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function classifyUrl(url) {
  if (!url || typeof url !== "string") return "invalid";
  if (url.includes("res.cloudinary.com")) return "cloudinary";
  if (url.startsWith("/uploads/")) return "local";
  if (url.startsWith("http")) return "external";
  return "other";
}

function classifyMeta(meta) {
  if (!meta) return "none";
  if (isCloudinaryOptimizedMeta(meta)) return "cloudinary_webp";
  if (meta.storage === "cloudinary") return "cloudinary_other";
  if (meta.format === "webp" && !meta.storage) return "local_webp";
  if (meta.format === "legacy") return "legacy";
  return "local_other";
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true, imagesMeta: true },
  });

  const report = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    summary: {
      local: 0,
      cloudinary: 0,
      external: 0,
      missing: 0,
      oversized: 0,
      cloudinaryWebpMeta: 0,
      localWebpMeta: 0,
      legacyMeta: 0,
      legacyOnly: 0,
    },
    products: [],
  };

  for (const product of products) {
    const images = parseImages(product.images);
    const imagesMeta = parseImagesMeta(product.imagesMeta);
    const entry = {
      id: product.id,
      name: product.name,
      imageCount: images.length,
      metaCount: imagesMeta.length,
      metaStorage: imagesMeta.map((m) => classifyMeta(m)),
      images: [],
    };

    const hasCloudinaryMeta = imagesMeta.some((m) => isCloudinaryOptimizedMeta(m));
    if (hasCloudinaryMeta) {
      report.summary.cloudinaryWebpMeta++;
    } else if (imagesMeta.length > 0) {
      const hasLocalWebp = imagesMeta.some((m) => m.format === "webp");
      if (hasLocalWebp) report.summary.localWebpMeta++;
      else report.summary.legacyMeta++;
    } else if (images.length > 0) {
      report.summary.legacyOnly++;
    }

    for (const url of images) {
      const type = classifyUrl(url);
      const imgInfo = { url, type, exists: null, sizeBytes: null };

      if (type === "local") {
        report.summary.local++;
        const filePath = getLocalFilePathFromUrl(url);
        if (filePath && fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          imgInfo.exists = true;
          imgInfo.sizeBytes = stat.size;
          if (stat.size > 500 * 1024) report.summary.oversized++;
        } else {
          imgInfo.exists = false;
          report.summary.missing++;
        }
      } else if (type === "cloudinary") {
        report.summary.cloudinary++;
      } else if (type === "external") {
        report.summary.external++;
      }

      entry.images.push(imgInfo);
    }

    report.products.push(entry);
  }

  const outPath = path.join(__dirname, "audit-product-images-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("=== Product Image Audit ===");
  console.log(`Products: ${report.totalProducts}`);
  console.log(`Cloudinary WebP (imagesMeta): ${report.summary.cloudinaryWebpMeta}`);
  console.log(`Local WebP meta: ${report.summary.localWebpMeta}`);
  console.log(`Legacy meta / legacy only: ${report.summary.legacyMeta + report.summary.legacyOnly}`);
  console.log(`Local image URLs: ${report.summary.local}`);
  console.log(`Cloudinary URLs: ${report.summary.cloudinary}`);
  console.log(`Missing files: ${report.summary.missing}`);
  console.log(`Oversized (>500KB): ${report.summary.oversized}`);
  console.log(`Report written to: ${outPath}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Audit failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
