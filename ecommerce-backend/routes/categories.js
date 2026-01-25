import express from "express";
import { verifyToken } from "../utils/auth.js";
import upload, { getImageUrl } from "../utils/upload.js";
import prisma from "../prisma.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
const router = express.Router();

// Get all categories (public) - Cached for 5 minutes
router.get("/", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category (public)
router.get("/:id", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: { products: { include: { sizes: true } } },
    });
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (Admin only)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    // Invalidate categories cache on create
    invalidateCache("/categories");
    
    const { name, slug, description, order } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await getImageUrl(req.file);
    }

    const category = await prisma.category.create({
      data: { 
        name, 
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        imageUrl: imageUrl || null,
        order: order !== undefined && order !== null && order !== "" ? Number(order) : 0,
      },
    });
    res.json(category);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Slug already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update category (Admin only)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    // Invalidate categories cache on update
    invalidateCache("/categories");
    
    const { name, slug, description, existingImageUrl, order } = req.body;
    
    let imageUrl = existingImageUrl || null;
    if (req.file) {
      imageUrl = await getImageUrl(req.file);
    }

    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { 
        name, 
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        imageUrl: imageUrl || null,
        order: order !== undefined && order !== null && order !== "" ? Number(order) : 0,
      },
    });
    res.json(category);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Slug already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete category (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Invalidate categories cache on delete
    invalidateCache("/categories");
    
    await prisma.category.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
