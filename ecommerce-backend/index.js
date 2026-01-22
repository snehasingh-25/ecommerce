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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
}));

app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("Backend is alive 🌱");
});

app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
