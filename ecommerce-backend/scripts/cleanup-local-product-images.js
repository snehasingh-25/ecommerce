/**
 * Remove legacy local product image directories after Cloudinary migration.
 *
 * Usage:
 *   node scripts/cleanup-local-product-images.js           # dry-run (default)
 *   node scripts/cleanup-local-product-images.js --execute # delete files
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import prisma from "../prisma.js";
import { parseImagesMeta, isCloudinaryOptimizedMeta } from "../utils/productImageStorage.js";
import { IMAGE_CONFIG } from "../config/images.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, "..");
const productsDir = path.join(backendRoot, IMAGE_CONFIG.productsDir);

const execute = process.argv.includes("--execute");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dirSize(dirPath) {
  let total = 0;
  if (!fs.existsSync(dirPath)) return 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

async function main() {
  console.log(`=== Cleanup Local Product Images (${execute ? "EXECUTE" : "DRY-RUN"}) ===`);

  if (!fs.existsSync(productsDir)) {
    console.log("No uploads/products directory found. Nothing to clean up.");
    await prisma.$disconnect();
    return;
  }

  const products = await prisma.product.findMany({
    select: { id: true, imagesMeta: true },
  });

  const fullyMigratedIds = new Set(
    products
      .filter((p) => {
        const meta = parseImagesMeta(p.imagesMeta);
        return meta.length > 0 && meta.every((m) => isCloudinaryOptimizedMeta(m));
      })
      .map((p) => String(p.id))
  );

  const entries = fs.readdirSync(productsDir, { withFileTypes: true });
  let totalBytes = 0;
  let removed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "_pending") continue;

    const productId = entry.name;
    const dirPath = path.join(productsDir, productId);

    if (!fullyMigratedIds.has(productId)) {
      console.log(`Skip product #${productId} — not fully migrated to Cloudinary`);
      continue;
    }

    const size = dirSize(dirPath);
    totalBytes += size;

    if (execute) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted ${dirPath} (${formatBytes(size)})`);
    } else {
      console.log(`Would delete ${dirPath} (${formatBytes(size)})`);
    }
    removed++;
  }

  const pendingDir = path.join(productsDir, "_pending");
  if (fs.existsSync(pendingDir)) {
    const pendingSize = dirSize(pendingDir);
    totalBytes += pendingSize;
    if (execute) {
      fs.rmSync(pendingDir, { recursive: true, force: true });
      console.log(`Deleted pending dir ${pendingDir} (${formatBytes(pendingSize)})`);
    } else {
      console.log(`Would delete pending dir ${pendingDir} (${formatBytes(pendingSize)})`);
    }
    removed++;
  }

  console.log(
    `${execute ? "Removed" : "Would remove"} ${removed} director${removed === 1 ? "y" : "ies"}, ` +
      `${formatBytes(totalBytes)} total`
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Cleanup failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
