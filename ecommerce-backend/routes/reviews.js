import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth.js";
import prisma from "../prisma.js";
import { getImageUrl } from "../utils/upload.js";
import { invalidateCache } from "../utils/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");

const router = express.Router();

const reviewImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
}).single("image");

function validateReviewInput({ customerName, rating, text }) {
  const name = String(customerName || "").trim();
  const reviewText = String(text || "").trim();
  const ratingNum = Number(rating);

  if (name.length < 2 || name.length > 80) {
    return { error: "Name must be between 2 and 80 characters" };
  }
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { error: "Rating must be an integer between 1 and 5" };
  }
  if (reviewText.length < 10 || reviewText.length > 2000) {
    return { error: "Review must be between 10 and 2000 characters" };
  }

  return { name, reviewText, ratingNum };
}

function formatReview(review) {
  return {
    id: review.id,
    productId: review.productId,
    customerName: review.customerName,
    rating: review.rating,
    text: review.text,
    imageUrl: review.imageUrl,
    isApproved: review.isApproved,
    createdAt: review.createdAt,
    product: review.product
      ? { id: review.product.id, name: review.product.name }
      : undefined,
  };
}

// Public: approved reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: "desc" },
    });

    const averageRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    res.json({
      reviews: reviews.map(formatReview),
      averageRating,
      totalCount: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: submit a review (pending admin approval)
router.post("/product/:productId", (req, res) => {
  reviewImageUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const productId = Number(req.params.productId);
      if (!Number.isFinite(productId)) {
        return res.status(400).json({ error: "Invalid product id" });
      }

      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const validation = validateReviewInput(req.body);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await getImageUrl(req.file);
      }

      const review = await prisma.productReview.create({
        data: {
          productId,
          customerName: validation.name,
          rating: validation.ratingNum,
          text: validation.reviewText,
          imageUrl,
          isApproved: false,
        },
      });

      invalidateCache("/products");

      res.status(201).json({
        message: "Thank you! Your review has been submitted and will appear after approval.",
        review: formatReview(review),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Admin: list all reviews
router.get("/", verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status === "pending") where.isApproved = false;
    if (status === "approved") where.isApproved = true;

    const reviews = await prisma.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true } } },
    });

    res.json(reviews.map(formatReview));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: approve review
router.patch("/:id/approve", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const review = await prisma.productReview.update({
      where: { id },
      data: { isApproved: true },
      include: { product: { select: { id: true, name: true } } },
    });

    invalidateCache("/products");
    res.json(formatReview(review));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: reject / delete review
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await prisma.productReview.delete({ where: { id: Number(req.params.id) } });
    invalidateCache("/products");
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
