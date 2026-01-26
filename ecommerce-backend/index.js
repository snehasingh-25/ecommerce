import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import cartRoutes from "./routes/cart.js";
import reelRoutes from "./routes/reels.js";
import occasionRoutes from "./routes/occasions.js";
import bannerRoutes from "./routes/banners.js";
import cache from "./utils/cache.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://giftchoice.net",
      "https://www.giftchoice.net"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);





// Enable HTTP keep-alive for connection pooling
app.set("keepAliveTimeout", 65000); // 65 seconds
app.set("headersTimeout", 66000); // 66 seconds (must be > keepAliveTimeout)

// CORS configuration

app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(join(__dirname, "uploads"), {
    etag: true,
    lastModified: true,
    maxAge: "30d",
    immutable: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("Backend is alive 🌱");
});

// Cache stats endpoint (for monitoring)
app.get("/cache/stats", (req, res) => {
  res.json(cache.getStats());
});

app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);
app.use("/cart", cartRoutes);
app.use("/reels", reelRoutes);
app.use("/occasions", occasionRoutes);
app.use("/banners", bannerRoutes);

const PORT = process.env.PORT || 3000;

// Create HTTP server with keep-alive enabled
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("HTTP keep-alive: Enabled");
  console.log("Prisma connection pooling: Enabled (singleton pattern)");
  console.log("Backend caching: Enabled (5min TTL for products, categories, occasions, banners, reels)");
});

// Enable keep-alive on the server
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
