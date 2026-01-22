import express from "express";
import pkg from "@prisma/client";
import { verifyToken } from "../utils/auth.js";
import upload, { getImageUrl } from "../utils/upload.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();

// Get all products (public)
router.get("/", async (req, res) => {
  try {
    const { category, isNew, isFestival } = req.query;
    
    // Build where clause
    const where = {};
    if (category) {
      where.category = { slug: category };
    }
    if (isNew === "true") {
      where.isNew = true;
    }
    if (isFestival === "true") {
      where.isFestival = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: { 
        sizes: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields
    const parsed = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      keywords: p.keywords ? JSON.parse(p.keywords) : [],
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        sizes: true,
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      keywords: product.keywords ? JSON.parse(product.keywords) : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product (Admin only)
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, badge, isFestival, isNew, categoryId, sizes, keywords } = req.body;

    // Upload images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await getImageUrl(file);
        imageUrls.push(url);
      }
    }

    // Parse sizes and keywords
    const sizesArray = sizes ? JSON.parse(sizes) : [];
    const keywordsArray = keywords ? JSON.parse(keywords) : [];

    // Convert price strings to floats for sizes
    const sizesWithFloatPrices = sizesArray.map(size => ({
      label: size.label,
      price: parseFloat(size.price) || 0,
    }));

    const product = await prisma.product.create({
      data: {
        name,
        description,
        badge: badge || null,
        isFestival: isFestival === "true" || isFestival === true,
        isNew: isNew === "true" || isNew === true,
        categoryId: Number(categoryId),
        images: JSON.stringify(imageUrls),
        keywords: JSON.stringify(keywordsArray),
        sizes: {
          create: sizesWithFloatPrices,
        },
      },
      include: { sizes: true },
    });

    res.json({
      ...product,
      images: imageUrls,
      keywords: keywordsArray,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update product (Admin only)
router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, badge, isFestival, isNew, categoryId, sizes, keywords, existingImages } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Handle images
    let imageUrls = existingImages ? JSON.parse(existingImages) : [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await getImageUrl(file);
        imageUrls.push(url);
      }
    }

    // Parse sizes and keywords
    const sizesArray = sizes ? JSON.parse(sizes) : [];
    const keywordsArray = keywords ? JSON.parse(keywords) : [];

    // Convert price strings to floats for sizes
    const sizesWithFloatPrices = sizesArray.map(size => ({
      label: size.label,
      price: parseFloat(size.price) || 0,
    }));

    // Delete old sizes and create new ones
    await prisma.productSize.deleteMany({
      where: { productId: Number(req.params.id) },
    });

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        badge: badge || null,
        isFestival: isFestival === "true" || isFestival === true,
        isNew: isNew === "true" || isNew === true,
        categoryId: Number(categoryId),
        images: JSON.stringify(imageUrls),
        keywords: JSON.stringify(keywordsArray),
        sizes: {
          create: sizesWithFloatPrices,
        },
      },
      include: { sizes: true },
    });

    res.json({
      ...product,
      images: imageUrls,
      keywords: keywordsArray,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
