import express from "express";
import { verifyToken } from "../utils/auth.js";
import { uploadProductMedia, getImageUrl, getVideoUrl } from "../utils/upload.js";
import prisma from "../prisma.js";
import { cacheMiddleware, invalidateCache } from "../utils/cache.js";
import { validateInstagramEmbeds } from "../utils/instagram.js";
const router = express.Router();

// Fisher-Yates shuffle algorithm for randomizing array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get filter options dynamically based on available products
router.get("/filters", cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const { category, occasion } = req.query;
    
    // Build base where clause for filtering
    const where = {};
    if (category) {
      where.categories = {
        some: {
          category: { slug: category }
        }
      };
    }
    if (occasion) {
      where.occasions = {
        some: {
          occasion: { slug: occasion }
        }
      };
    }

    // Fetch all products with sizes for analysis
    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
        categories: {
          include: { category: true }
        },
        occasions: {
          include: { occasion: true }
        }
      }
    });

    // Extract unique sizes
    const sizeSet = new Set();
    const priceValues = [];
    
    products.forEach(product => {
      if (product.hasSinglePrice && product.singlePrice) {
        priceValues.push(product.singlePrice);
      } else if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => {
          sizeSet.add(size.label);
          if (size.price) priceValues.push(size.price);
        });
      }
    });

    // Calculate price range
    const minPrice = priceValues.length > 0 ? Math.floor(Math.min(...priceValues)) : 0;
    const maxPrice = priceValues.length > 0 ? Math.ceil(Math.max(...priceValues)) : 10000;
    
    // Get unique badges
    const badges = [...new Set(products.map(p => p.badge).filter(Boolean))];

    // Get categories and occasions
    const categories = [...new Set(products.flatMap(p => 
      p.categories.map(pc => ({ id: pc.category.id, name: pc.category.name, slug: pc.category.slug }))
    ))].reduce((acc, cat) => {
      if (!acc.find(c => c.id === cat.id)) acc.push(cat);
      return acc;
    }, []);

    const occasions = [...new Set(products.flatMap(p => 
      p.occasions.map(po => ({ id: po.occasion.id, name: po.occasion.name, slug: po.occasion.slug }))
    ))].reduce((acc, occ) => {
      if (!acc.find(o => o.id === occ.id)) acc.push(occ);
      return acc;
    }, []);

    res.json({
      sizes: Array.from(sizeSet).sort(),
      priceRange: { min: minPrice, max: maxPrice },
      badges,
      categories,
      occasions,
      availability: {
        isNew: products.some(p => p.isNew),
        isTrending: products.some(p => p.isTrending),
        isFestival: products.some(p => p.isFestival),
        isReady60Min: products.some(p => p.isReady60Min)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (public) - Cached for 5 minutes (unless shuffle is enabled)
router.get("/", (req, res, next) => {
  // Skip caching when shuffle is enabled to ensure different order on each refresh
  const shouldShuffle = req.query.shuffle !== "false";
  if (shouldShuffle) {
    return next(); // Skip cache middleware
  }
  return cacheMiddleware(5 * 60 * 1000)(req, res, next);
}, async (req, res) => {
  try {
    const { 
      category, occasion, isNew, isFestival, isTrending, isReady60Min, 
      search, shuffle, sort, 
      minPrice, maxPrice, size, badge 
    } = req.query;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limit = typeof limitRaw === "string" ? Math.min(Math.max(parseInt(limitRaw, 10) || 0, 0), 50) : 0;
    const offset = typeof offsetRaw === "string" ? Math.max(parseInt(offsetRaw, 10) || 0, 0) : 0;
    
    // Check if shuffle is enabled (default to true for variety)
    const shouldShuffle = shuffle !== "false";
    
    // Build where clause
    const where = {};
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
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
    if (isReady60Min === "true") {
      where.isReady60Min = true;
    }
    if (badge) {
      where.badge = badge;
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
      categories: {
        include: {
          category: true,
        },
      },
      occasions: {
        include: {
          occasion: true,
        },
      },
    };

    // Determine sort order
    let orderBy = [{ order: "asc" }, { createdAt: "desc" }];
    if (sort) {
      switch (sort) {
        case "price_low":
          orderBy = [{ order: "asc" }]; // Will sort by price after fetching
          break;
        case "price_high":
          orderBy = [{ order: "asc" }]; // Will sort by price after fetching
          break;
        case "newest":
          orderBy = [{ createdAt: "desc" }];
          break;
        case "popularity":
          orderBy = [{ isTrending: "desc" }, { order: "asc" }, { createdAt: "desc" }];
          break;
        case "relevance":
        default:
          // Keep default order or shuffle
          break;
      }
    }

    const queryBase = {
      where,
      include,
      orderBy: shouldShuffle && !sort ? undefined : orderBy,
    };

    let products = [];
    let total = 0;

    // If shuffling is enabled and no sort, fetch all products first, shuffle, then paginate
    if (shouldShuffle && !sort) {
      // Fetch all matching products
      const allProducts = await prisma.product.findMany({
        where,
        include,
      });
      
      total = allProducts.length;
      
      // Shuffle the products randomly
      const shuffled = shuffleArray(allProducts);
      
      // Apply pagination after shuffling
      if (limit > 0) {
        products = shuffled.slice(offset, offset + limit);
        res.setHeader("X-Total-Count", String(total));
        res.setHeader("X-Limit", String(limit));
        res.setHeader("X-Offset", String(offset));
      } else {
        products = shuffled;
      }
    } else {
      // Use original logic when shuffle is disabled or sort is specified
      if (limit > 0) {
        const [items, count] = await prisma.$transaction([
          prisma.product.findMany({
            ...queryBase,
            skip: offset,
            take: limit,
          }),
          prisma.product.count({ where }),
        ]);
        products = items;
        total = count;
        res.setHeader("X-Total-Count", String(total));
        res.setHeader("X-Limit", String(limit));
        res.setHeader("X-Offset", String(offset));
      } else {
        products = await prisma.product.findMany(queryBase);
        total = products.length;
      }
    }

    // Parse JSON fields
    let parsed = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      videos: p.videos ? JSON.parse(p.videos) : [],
      keywords: p.keywords ? JSON.parse(p.keywords) : [],
      categories: p.categories ? p.categories.map(pc => pc.category) : [],
      occasions: p.occasions ? p.occasions.map(po => po.occasion) : [],
    }));

    // Apply price and size filters (after fetching)
    if (minPrice || maxPrice || size) {
      parsed = parsed.filter(p => {
        // Price filter
        if (minPrice || maxPrice) {
          const productPrice = p.hasSinglePrice ? p.singlePrice : 
            (p.sizes && p.sizes.length > 0 ? Math.min(...p.sizes.map(s => s.price)) : null);
          if (productPrice === null) return false;
          if (minPrice && productPrice < parseFloat(minPrice)) return false;
          if (maxPrice && productPrice > parseFloat(maxPrice)) return false;
        }
        
        // Size filter
        if (size) {
          const sizeArray = Array.isArray(size) ? size : [size];
          if (p.hasSinglePrice) return false; // Single price products don't have sizes
          if (!p.sizes || p.sizes.length === 0) return false;
          const productSizes = p.sizes.map(s => s.label);
          if (!sizeArray.some(s => productSizes.includes(s))) return false;
        }
        
        return true;
      });
    }

    // Apply price sorting (after fetching and filtering)
    if (sort === "price_low" || sort === "price_high") {
      parsed.sort((a, b) => {
        const getMinPrice = (p) => {
          if (p.hasSinglePrice && p.singlePrice) return p.singlePrice;
          if (p.sizes && p.sizes.length > 0) return Math.min(...p.sizes.map(s => s.price));
          return Infinity;
        };
        const priceA = getMinPrice(a);
        const priceB = getMinPrice(b);
        return sort === "price_low" ? priceA - priceB : priceB - priceA;
      });
    }

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
        categories: {
          include: {
            category: true
          }
        },
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
      videos: product.videos ? JSON.parse(product.videos) : [],
      instagramEmbeds: product.instagramEmbeds ? JSON.parse(product.instagramEmbeds) : [],
      keywords: product.keywords ? JSON.parse(product.keywords) : [],
      categories: product.categories ? product.categories.map(pc => pc.category) : [],
      occasions: product.occasions ? product.occasions.map(po => po.occasion) : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product (Admin only)
router.post("/", verifyToken, uploadProductMedia, async (req, res) => {
  try {
    // Invalidate products cache on create
    invalidateCache("/products");
    
    const { name, description, badge, isFestival, isNew, isTrending, isReady60Min, hasSinglePrice, singlePrice, originalPrice, categoryIds, sizes, keywords, occasionIds, existingImages, existingVideos, instagramEmbeds } = req.body;

    // Upload images; for duplicate/create, existingImages can provide initial URLs
    let imageUrls = [];
    if (existingImages) {
      try {
        const parsed = typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsed)) imageUrls = parsed;
      } catch (_) {}
    }
    const imageFiles = req.files?.images || [];
    for (const file of imageFiles) {
      const url = await getImageUrl(file);
      imageUrls.push(url);
    }
    // Upload videos; existingVideos can provide initial URLs (e.g. duplicate)
    let videoUrls = [];
    if (existingVideos) {
      try {
        const parsed = typeof existingVideos === "string" ? JSON.parse(existingVideos) : existingVideos;
        if (Array.isArray(parsed)) videoUrls = parsed;
      } catch (_) {}
    }
    const videoFiles = req.files?.videos || [];
    for (const file of videoFiles) {
      const url = await getVideoUrl(file);
      videoUrls.push(url);
    }

    // Parse sizes, keywords, and Instagram embeds
    const sizesArray = sizes ? JSON.parse(sizes) : [];
    const keywordsArray = keywords ? JSON.parse(keywords) : [];
    const instagramEmbedsArray = instagramEmbeds ? JSON.parse(instagramEmbeds) : [];
    const validatedInstagramEmbeds = validateInstagramEmbeds(instagramEmbedsArray);

    // Convert price strings to floats for sizes; support originalPrice (MRP)
    const sizesWithFloatPrices = sizesArray.map(size => ({
      label: size.label,
      price: parseFloat(size.price) || 0,
      originalPrice: size.originalPrice != null && size.originalPrice !== "" ? parseFloat(size.originalPrice) : null,
    }));

    // Parse category and occasion IDs
    const categoryIdsArray = categoryIds ? JSON.parse(categoryIds) : [];
    const occasionIdsArray = occasionIds ? JSON.parse(occasionIds) : [];

    const product = await prisma.product.create({
      data: {
        name,
        description,
        badge: badge || null,
        isFestival: isFestival === "true" || isFestival === true,
        isNew: isNew === "true" || isNew === true,
        isTrending: isTrending === "true" || isTrending === true,
        isReady60Min: isReady60Min === "true" || isReady60Min === true,
        hasSinglePrice: hasSinglePrice === "true" || hasSinglePrice === true,
        singlePrice: hasSinglePrice === "true" || hasSinglePrice === true ? (singlePrice ? parseFloat(singlePrice) : null) : null,
        originalPrice: originalPrice != null && originalPrice !== "" ? parseFloat(originalPrice) : null,
        images: JSON.stringify(imageUrls),
        videos: videoUrls.length > 0 ? JSON.stringify(videoUrls) : null,
        instagramEmbeds: validatedInstagramEmbeds.length > 0 ? JSON.stringify(validatedInstagramEmbeds) : null,
        keywords: JSON.stringify(keywordsArray),
        categories: {
          create: categoryIdsArray.map(categoryId => ({
            categoryId: Number(categoryId)
          }))
        },
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
        categories: {
          include: {
            category: true
          }
        },
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
      videos: videoUrls,
      keywords: keywordsArray,
      occasions: product.occasions ? product.occasions.map(po => po.occasion) : [],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update product (Admin only)
router.put("/:id", verifyToken, uploadProductMedia, async (req, res) => {
  try {
    // Invalidate products cache on update
    invalidateCache("/products");
    
    const { name, description, badge, isFestival, isNew, isTrending, isReady60Min, hasSinglePrice, singlePrice, originalPrice, categoryIds, sizes, keywords, existingImages, existingVideos, instagramEmbeds, occasionIds } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Handle images
    let imageUrls = existingImages ? JSON.parse(existingImages) : [];
    const imageFiles = req.files?.images || [];
    for (const file of imageFiles) {
      const url = await getImageUrl(file);
      imageUrls.push(url);
    }
    // Handle videos
    let videoUrls = existingVideos ? JSON.parse(existingVideos) : [];
    const videoFiles = req.files?.videos || [];
    for (const file of videoFiles) {
      const url = await getVideoUrl(file);
      videoUrls.push(url);
    }

    // Parse sizes, keywords, and Instagram embeds
    const sizesArray = sizes ? JSON.parse(sizes) : [];
    const keywordsArray = keywords ? JSON.parse(keywords) : [];
    const instagramEmbedsArray = instagramEmbeds ? JSON.parse(instagramEmbeds) : [];
    const validatedInstagramEmbeds = validateInstagramEmbeds(instagramEmbedsArray);

    // Convert price strings to floats for sizes; support originalPrice (MRP)
    const sizesWithFloatPrices = sizesArray.map(size => ({
      label: size.label,
      price: parseFloat(size.price) || 0,
      originalPrice: size.originalPrice != null && size.originalPrice !== "" ? parseFloat(size.originalPrice) : null,
    }));

    // Delete old sizes and create new ones
    await prisma.productSize.deleteMany({
      where: { productId: Number(req.params.id) },
    });

    // Delete old category links
    await prisma.productCategory.deleteMany({
      where: { productId: Number(req.params.id) },
    });

    // Delete old occasion links
    await prisma.productOccasion.deleteMany({
      where: { productId: Number(req.params.id) },
    });

    // Parse category and occasion IDs
    const categoryIdsArray = categoryIds ? JSON.parse(categoryIds) : [];
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
        isReady60Min: isReady60Min === "true" || isReady60Min === true,
        hasSinglePrice: hasSinglePrice === "true" || hasSinglePrice === true,
        singlePrice: hasSinglePrice === "true" || hasSinglePrice === true ? (singlePrice ? parseFloat(singlePrice) : null) : null,
        originalPrice: originalPrice != null && originalPrice !== "" ? parseFloat(originalPrice) : null,
        images: JSON.stringify(imageUrls),
        videos: videoUrls.length > 0 ? JSON.stringify(videoUrls) : null,
        instagramEmbeds: validatedInstagramEmbeds.length > 0 ? JSON.stringify(validatedInstagramEmbeds) : null,
        keywords: JSON.stringify(keywordsArray),
        categories: {
          create: categoryIdsArray.map(categoryId => ({
            categoryId: Number(categoryId)
          }))
        },
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
        categories: {
          include: {
            category: true
          }
        },
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
      videos: videoUrls,
      instagramEmbeds: validatedInstagramEmbeds,
      keywords: keywordsArray,
      categories: product.categories ? product.categories.map(pc => pc.category) : [],
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
