import express from "express";
import pkg from "@prisma/client";
import { verifyToken } from "../utils/auth.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();

// Get all active reels (public)
router.get("/", async (req, res) => {
  try {
    const reels = await prisma.reel.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        product: {
          include: { sizes: true, category: true },
        },
      },
    });
    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reels (Admin only)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const reels = await prisma.reel.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        product: {
          include: { sizes: true, category: true },
        },
      },
    });
    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reel (Admin only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, url, videoUrl, thumbnail, platform, isActive, order, productId, isTrending, discountPct } = req.body;

    const reel = await prisma.reel.create({
      data: {
        title: title || null,
        url: url || null,
        videoUrl: videoUrl || url || null, // Use videoUrl if provided, fallback to url
        thumbnail: thumbnail || null,
        platform: platform || "native",
        productId: productId ? Number(productId) : null,
        isTrending: isTrending === "true" || isTrending === true,
        discountPct: discountPct !== undefined && discountPct !== null && discountPct !== "" ? Number(discountPct) : null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });

    res.json(reel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reel (Admin only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, url, videoUrl, thumbnail, platform, isActive, order, productId, isTrending, discountPct } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl || url || null; // Use videoUrl if provided, fallback to url
    } else if (url !== undefined) {
      // If only url is provided, also update videoUrl
      updateData.videoUrl = url || null;
    }
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (platform !== undefined) updateData.platform = platform;
    if (productId !== undefined) updateData.productId = productId ? Number(productId) : null;
    if (isTrending !== undefined) updateData.isTrending = isTrending === "true" || isTrending === true;
    if (discountPct !== undefined) {
      updateData.discountPct = discountPct !== null && discountPct !== "" ? Number(discountPct) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const reel = await prisma.reel.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });

    res.json(reel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment view count (public)
router.post("/:id/view", async (req, res) => {
  try {
    const reel = await prisma.reel.update({
      where: { id: Number(req.params.id) },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
    res.json(reel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reel (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await prisma.reel.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Reel deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
