import express from "express";
import { verifyToken } from "../utils/auth.js";
import upload, { getImageUrl } from "../utils/upload.js";
import prisma from "../prisma.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
const router = express.Router();

// Get all products (public) - Cached for 5 minutes
router.get("/", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const { category, occasion, isNew, isFestival, isTrending, search } = req.query;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limit = typeof limitRaw === "string" ? Math.min(Math.max(parseInt(limitRaw, 10) || 0, 0), 50) : 0;
    const offset = typeof offsetRaw === "string" ? Math.max(parseInt(offsetRaw, 10) || 0, 0) : 0;
    
    // Build where clause
    const where = {};
    if (category) {
      where.category = { slug: category };
    }
    if (occasion) {
      where.occasions = {
        some: {
          occasion: {
            slug: occasion
          }
        }
      };
    }
    if (isNew === "true") {
      where.isNew = true;
    }
    if (isFestival === "true") {
      where.isFestival = true;
    }
    if (isTrending === "true") {
      where.isTrending = true;
    }
    if (search) {
      // First, try to find matching occasions
      const matchingOccasions = await prisma.occasion.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search.toLowerCase().replace(/\s+/g, '-') } },
          ],
          isActive: true
        },
        select: { id: true }
      });

      const occasionIds = matchingOccasions.map(o => o.id);

      // Search in name, description, keywords, and occasions
      const searchConditions = [
        { name: { contains: search } },
        { description: { contains: search } },
        { name: { startsWith: search } }, // Partial match at start
      ];

      // If matching occasions found, include products linked to those occasions
      if (occasionIds.length > 0) {
        searchConditions.push({
          occasions: {
            some: {
              occasionId: { in: occasionIds }
            }
          }
        });
      }

      where.OR = searchConditions;
    }

    const include = {
      sizes: true,
      category: true,
      occasions: {
        include: {
          occasion: true,
        },
      },
    };

    const queryBase = {
      where,
      include,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    };

    let products = [];
    if (limit > 0) {
      const [items, total] = await prisma.$transaction([
        prisma.product.findMany({
          ...queryBase,
          skip: offset,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      products = items;
      res.setHeader("X-Total-Count", String(total));
      res.setHeader("X-Limit", String(limit));
      res.setHeader("X-Offset", String(offset));
    } else {
      products = await prisma.product.findMany(queryBase);
    }

    // Parse JSON fields
    const parsed = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      keywords: p.keywords ? JSON.parse(p.keywords) : [],
      occasions: p.occasions ? p.occasions.map(po => po.occasion) : [],
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product (public) - Cached for 5 minutes
router.get("/:id", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        sizes: true,
        category: true,
        occasions: {
          include: {
            occasion: true
          }
        }
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      keywords: product.keywords ? JSON.parse(product.keywords) : [],
      occasions: product.occasions ? product.occasions.map(po => po.occasion) : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product (Admin only)
router.post("/", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    // Invalidate products cache on create
    invalidateCache("/products");
    
    const { name, description, badge, isFestival, isNew, isTrending, categoryId, sizes, keywords, occasionIds } = req.body;

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

    // Parse occasion IDs
    const occasionIdsArray = occasionIds ? JSON.parse(occasionIds) : [];

    const product = await prisma.product.create({
      data: {
        name,
        description,
        badge: badge || null,
        isFestival: isFestival === "true" || isFestival === true,
        isNew: isNew === "true" || isNew === true,
        isTrending: isTrending === "true" || isTrending === true,
        categoryId: Number(categoryId),
        images: JSON.stringify(imageUrls),
        keywords: JSON.stringify(keywordsArray),
        sizes: {
          create: sizesWithFloatPrices,
        },
        occasions: {
          create: occasionIdsArray.map(occasionId => ({
            occasionId: Number(occasionId)
          }))
        }
      },
      include: { 
        sizes: true,
        occasions: {
          include: {
            occasion: true
          }
        }
      },
    });

    res.json({
      ...product,
      images: imageUrls,
      keywords: keywordsArray,
      occasions: product.occasions ? product.occasions.map(po => po.occasion) : [],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update product (Admin only)
router.put("/:id", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    // Invalidate products cache on update
    invalidateCache("/products");
    
    const { name, description, badge, isFestival, isNew, isTrending, categoryId, sizes, keywords, existingImages, occasionIds } = req.body;

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

    // Delete old occasion links
    await prisma.productOccasion.deleteMany({
      where: { productId: Number(req.params.id) },
    });

    // Parse occasion IDs
    const occasionIdsArray = occasionIds ? JSON.parse(occasionIds) : [];

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        badge: badge || null,
        isFestival: isFestival === "true" || isFestival === true,
        isNew: isNew === "true" || isNew === true,
        isTrending: isTrending === "true" || isTrending === true,
        categoryId: Number(categoryId),
        images: JSON.stringify(imageUrls),
        keywords: JSON.stringify(keywordsArray),
        sizes: {
          create: sizesWithFloatPrices,
        },
        occasions: {
          create: occasionIdsArray.map(occasionId => ({
            occasionId: Number(occasionId)
          }))
        }
      },
      include: { 
        sizes: true,
        occasions: {
          include: {
            occasion: true
          }
        }
      },
    });

    res.json({
      ...product,
      images: imageUrls,
      keywords: keywordsArray,
      occasions: product.occasions ? product.occasions.map(po => po.occasion) : [],
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update order for multiple products (Admin only)
router.post("/reorder", verifyToken, async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items must be an array" });
    }

    // Invalidate products cache
    invalidateCache("/products");

    // Update all products in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: Number(item.id) },
          data: { order: Number(item.order) },
        })
      )
    );

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Reorder products error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Invalidate products cache on delete
    invalidateCache("/products");
    
    await prisma.product.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
