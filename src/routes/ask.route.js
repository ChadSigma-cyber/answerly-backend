const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.post("/", async (req, res) => {
  try {
    const { text, imageBase64 } = req.body;

    let finalText = text || "";

    // 🔹 If image exists → OCR first
    if (imageBase64) {
      const visionResponse = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }
      );

      const extractedText =
        visionResponse.data.responses?.[0]?.fullTextAnnotation?.text || "";

      finalText = extractedText + "\n\n" + (text || "");
    }

    if (!finalText.trim()) {
      return res.status(400).json({ error: "No input" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: finalText },
      ],
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) res.write(token);
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.end();
  }
});
module.exports = router;
