import express from "express";
import { verifyToken } from "../utils/auth.js";
import upload, { getImageUrl } from "../utils/upload.js";
import prisma from "../prisma.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
const router = express.Router();

// Get all relations (public) - Cached for 5 minutes
router.get("/", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const relations = await prisma.relation.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all relations (admin - includes inactive)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const relations = await prisma.relation.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single relation (public) - Cached for 5 minutes
router.get("/:slug", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const relation = await prisma.relation.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                sizes: true,
                categories: {
                  include: {
                    category: true,
                  }
                },
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
    });

    if (!relation) {
      return res.status(404).json({ message: "Relation not found" });
    }

    // Transform products
    const products = relation.products.map(pr => {
      const p = pr.product;
      return {
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        keywords: p.keywords ? JSON.parse(p.keywords) : [],
        categories: p.categories ? p.categories.map(pc => pc.category) : [],
      };
    });

    res.json({
      ...relation,
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create relation (Admin only)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    invalidateCache("/relations");

    const { name, slug, description, isActive } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await getImageUrl(req.file);
    }

    const relation = await prisma.relation.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl,
        isActive: isActive === "true" || isActive === true,
      },
    });

    res.json(relation);
  } catch (error) {
    console.error("Create relation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update relation (Admin only)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    invalidateCache("/relations");

    const { name, slug, description, isActive, existingImage } = req.body;

    const existingRelation = await prisma.relation.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!existingRelation) {
      return res.status(404).json({ message: "Relation not found" });
    }

    let imageUrl = existingImage || existingRelation.imageUrl;
    if (req.file) {
      imageUrl = await getImageUrl(req.file);
    }

    const relation = await prisma.relation.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        slug,
        description: description || null,
        imageUrl,
        isActive: isActive === "true" || isActive === true,
      },
    });

    res.json(relation);
  } catch (error) {
    console.error("Update relation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete relation (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    invalidateCache("/relations");

    await prisma.relation.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Relation deleted successfully" });
  } catch (error) {
    console.error("Delete relation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update order for multiple relations (Admin only)
router.post("/reorder", verifyToken, async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items must be an array" });
    }

    invalidateCache("/relations");

    await prisma.$transaction(
      items.map((item) =>
        prisma.relation.update({
          where: { id: Number(item.id) },
          data: { order: Number(item.order) },
        })
      )
    );

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Reorder relations error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
