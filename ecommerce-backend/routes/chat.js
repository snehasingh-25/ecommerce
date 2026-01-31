import express from "express";
import OpenAI from "openai";
import prisma from "../prisma.js";

const router = express.Router();

const GIFT_BUDDY_SYSTEM_PROMPT = `You are Gift Buddy 🤝🎁, a friendly, cheerful, and intelligent Gift Shopping Assistant for an online gift shop website.

Your mission is to help customers quickly and happily find the perfect gift by understanding:
- Occasion
- Recipient
- Budget
- Quantity (single or bulk)

You must behave like a real human gift advisor, not a robot.

TONE & STYLE: Warm, friendly, festive. Short, clear, easy to read. Helpful, never pushy. Emotion-focused. Use emojis sparingly 🎁😊. Never sound robotic or salesy.

GIFT SUGGESTION RULES (CRITICAL):
- Suggest ONLY 2–4 products maximum. Never show more than 4.
- Every suggestion must include: Gift name, Why it's a good gift (emotion or use-case), Price range, CTA: "View Gift" or "Add to Cart"
- Use ONLY products from the LIVE_PRODUCT_DATA provided. Never invent products or prices.
- If a product is marked out of stock, never suggest it.
- Match intent using product names, categories, descriptions, occasions, and common gifting use-cases.

BUDGET INTELLIGENCE: Always respect user budget. If no exact match exists, suggest slightly higher or lower options and explain politely.

CATEGORY-AWARE: If user asks for a category, suggest products only from that category. You may suggest closely related categories.

IF PRODUCT UNAVAILABLE: "This gift is currently out of stock 😕 But I can show you similar and equally beautiful options."

IF DATA UNAVAILABLE: "I'm syncing the latest gifts right now 😊 Meanwhile, you can chat with me directly on WhatsApp for quick help 🎁"

TRUST & SALES: Never over-promise. Be honest. Focus on customer happiness.

RESPONSE FORMAT (JSON only): Reply with exactly this JSON structure, nothing else:
{"message": "Your conversational reply here", "productIds": [id1, id2, ...]}

- "message": Your full reply to the user (can include product names and descriptions).
- "productIds": Array of product IDs (numbers) you are suggesting. Use IDs from LIVE_PRODUCT_DATA only. Empty array [] if no products suggested.
- Suggest 2-4 products max when recommending gifts.`;

function buildProductContext(products, categories, occasions) {
  const items = products.map((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const cats = (p.categories || []).map((c) => c.name || c).join(", ");
    const occs = (p.occasions || []).map((o) => o.name || o).join(", ");
    let priceStr = "";
    if (p.hasSinglePrice && p.singlePrice != null) {
      priceStr = `₹${p.singlePrice}`;
    } else if (p.sizes && p.sizes.length > 0) {
      const prices = p.sizes.map((s) => s.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceStr = min === max ? `₹${min}` : `₹${min} - ₹${max}`;
    }
    return {
      id: p.id,
      name: p.name,
      description: (p.description || "").slice(0, 200),
      price: priceStr,
      categories: cats,
      occasions: occs,
      isTrending: !!p.isTrending,
      isNew: !!p.isNew,
      isFestival: !!p.isFestival,
      inStock: true,
    };
  });
  return JSON.stringify(items, null, 2);
}

function buildWelcomeContext(categories, occasions) {
  const catNames = (categories || []).map((c) => c.name).filter(Boolean);
  const occNames = (occasions || []).map((o) => o.name).filter(Boolean);
  return { categories: catNames, occasions: occNames };
}

router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({
        error: "OPENAI_API_KEY is not configured. Add it in your server environment variables.",
      });
    }

    const { messages = [], isNewChat } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const [productsRaw, categories, occasions] = await Promise.all([
      prisma.product.findMany({
        where: {},
        include: {
          sizes: true,
          categories: { include: { category: true } },
          occasions: { include: { occasion: true } },
        },
        orderBy: [{ order: "asc" }, { isTrending: "desc" }, { isNew: "desc" }, { createdAt: "desc" }],
      }),
      prisma.category.findMany({ orderBy: { order: "asc" } }),
      prisma.occasion.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    ]);

    const products = productsRaw.map((p) => {
      let imgs = [];
      try {
        const parsed = JSON.parse(p.images || "[]");
        imgs = Array.isArray(parsed) ? parsed : [];
      } catch (_) {}
      return {
        ...p,
        images: imgs,
        categories: (p.categories || []).map((pc) => pc.category),
        occasions: (p.occasions || []).map((po) => po.occasion),
      };
    });

    const productContext = buildProductContext(products, categories, occasions);
    const welcomeContext = buildWelcomeContext(categories, occasions);

    const systemContent = `${GIFT_BUDDY_SYSTEM_PROMPT}

LIVE_PRODUCT_DATA (use these IDs when suggesting products):
${productContext}

AVAILABLE_CATEGORIES: ${JSON.stringify(welcomeContext.categories)}
AVAILABLE_OCCASIONS: ${JSON.stringify(welcomeContext.occasions)}
`;

    const openai = new OpenAI({ apiKey });
    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({
        role: m.role === "user" || m.role === "assistant" ? m.role : "user",
        content: String(m.content || ""),
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: "No response from assistant." });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.json({ message: raw, products: [] });
    }

    const productIds = Array.isArray(parsed.productIds) ? parsed.productIds : [];
    const suggested = products.filter((p) => productIds.includes(p.id)).slice(0, 4);

    const productPayload = suggested.map((p) => ({
      id: p.id,
      name: p.name,
      description: (p.description || "").slice(0, 200),
      images: p.images || [],
      hasSinglePrice: p.hasSinglePrice,
      singlePrice: p.singlePrice,
      originalPrice: p.originalPrice,
      sizes: (p.sizes || []).map((s) => ({ id: s.id, label: s.label, price: s.price, originalPrice: s.originalPrice })),
      categories: (p.categories || []).map((c) => ({ id: c?.id, name: c?.name })),
      occasions: (p.occasions || []).map((o) => ({ id: o?.id, name: o?.name })),
      badge: p.badge,
      isTrending: p.isTrending,
      isNew: p.isNew,
    }));

    return res.json({
      message: parsed.message || raw,
      products: productPayload,
    });
  } catch (err) {
    console.error("Chat error:", err);
    const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 500;
    const message = err.message || err.error?.message || "Chat failed.";
    return res.status(status).json({ error: message });
  }
});

export default router;
