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
    });
    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reel (Admin only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, url, thumbnail, platform, isActive, order } = req.body;

    const reel = await prisma.reel.create({
      data: {
        title: title || null,
        url,
        thumbnail: thumbnail || null,
        platform: platform || "youtube",
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
    const { title, url, thumbnail, platform, isActive, order } = req.body;

    const reel = await prisma.reel.update({
      where: { id: Number(req.params.id) },
      data: {
        title: title !== undefined ? title : undefined,
        url: url || undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        platform: platform || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        order: order !== undefined ? order : undefined,
      },
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
