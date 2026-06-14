/**
 * Central image optimization configuration.
 * Used by upload pipeline, migration scripts, and cleanup utilities.
 */
export const IMAGE_CONFIG = {
  /** Storage backend for new product images */
  storage: process.env.IMAGE_STORAGE || "cloudinary",

  /** Cloudinary folder for product images */
  cloudinaryFolder: "ecommerce/products",

  /** Max raw upload size before optimization (Multer) */
  maxUploadBytes: 10 * 1024 * 1024,

  /** Max file size for the canonical WebP stored on Cloudinary */
  maxBytes: {
    original: 500 * 1024,
  },

  /** Max long edge in pixels for the canonical WebP */
  maxLongEdge: 2000,

  /** Variant widths — used for Cloudinary transform URLs (not separate stored files) */
  variants: {
    thumb: 320,
    medium: 800,
    large: 1200,
  },

  /** WebP encoder defaults — quality stepped down automatically if over size limit */
  webp: {
    quality: 88,
    effort: 4,
    minQuality: 75,
    qualityStep: 3,
  },

  /** Allowed input MIME types for product images */
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],

  /** Legacy local paths (migration/cleanup only) */
  productsDir: "uploads/products",
  pendingDir: "uploads/products/_pending",
  backupDirName: "backup",
};

export const VARIANT_NAMES = ["thumb", "medium", "large", "original"];
