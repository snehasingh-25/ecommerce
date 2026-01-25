import express from "express";
import { verifyToken } from "../utils/auth.js";
import upload, { getImageUrl } from "../utils/upload.js";
import prisma from "../prisma.js";
const router = express.Router();

// Get all active banners (public)
router.get("/", async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all banners (admin - includes inactive)
router.get("/all", verifyToken, async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single banner (admin)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create banner (Admin only)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, isActive, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imageUrl = await getImageUrl(req.file);

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        isActive: isActive === "true" || isActive === true,
        order: order ? Number(order) : 0,
      },
    });

    res.json(banner);
  } catch (error) {
    console.error("Create banner error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update banner (Admin only)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, isActive, order, existingImage } = req.body;

    const existingBanner = await prisma.banner.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!existingBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    let imageUrl = existingImage || existingBanner.imageUrl;
    if (req.file) {
      imageUrl = await getImageUrl(req.file);
    }

    const banner = await prisma.banner.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        isActive: isActive === "true" || isActive === true,
        order: order ? Number(order) : 0,
      },
    });

    res.json(banner);
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete banner (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
