import express from "express";
import OpenAI from "openai";

const router = express.Router();

const systemPrompt = `You are a professional e-commerce copywriter and SEO expert.

Your task is to generate a high-quality, human-written product description based on the details provided.

INSTRUCTIONS:
- Write a natural, engaging, and premium-sounding product description
- Do NOT sound robotic or artificial
- Keep language simple, attractive, and customer-friendly
- Highlight benefits more than features
- Make it suitable for Indian e-commerce audience
- Avoid false claims
- Do NOT mention the words "AI", "generated", or "SEO"

OUTPUT FORMAT (return exactly this structure as plain text, with clear section labels):
1. Short Catchy Title (1 line)
2. Main Description (80–120 words)
3. Bullet Points (4–6 points, one per line with a bullet)
4. Best For / Ideal For (1 line)

Tone: Professional + Trust-building + Sales-oriented.`;

function buildUserMessage(body) {
  const {
    product_name = "",
    category = "",
    size = "",
    material = "",
    color = "",
    target_audience = "",
    price_range = "",
    use_case = "",
    features = "",
    language = "English",
  } = body;

  return `Generate a product description in ${language} (Hindi / English / Hinglish as specified).

INPUT DETAILS:
Product Name: ${product_name}
Category: ${category}
Size/Variant: ${size}
Material: ${material || "Not specified"}
Color: ${color || "Not specified"}
Target Audience: ${target_audience || "Not specified"}
Price Range: ${price_range || "Not specified"}
Use Case / Occasion: ${use_case || "Not specified"}
Key Features (if any): ${features || "None"}

Respond with the full description in the required format (Title, Main Description, Bullet Points, Best For). Use only plain text.`;
}

router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({
        error: "OPENAI_API_KEY is not configured. Add it in your server environment variables.",
      });
    }

    const openai = new OpenAI({ apiKey });
    const userMessage = buildUserMessage(req.body);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return res.status(502).json({ error: "No description returned from service." });
    }

    return res.json({ description: text });
  } catch (err) {
    console.error("Generate description error:", err);
    const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 500;
    const message =
      err.message ||
      err.error?.message ||
      "Failed to generate description.";
    return res.status(status).json({ error: message });
  }
});

export default router;
