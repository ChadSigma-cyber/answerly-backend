const express = require("express");
const router = express.Router();
const axios = require("axios");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    /* 🔹 1. GOOGLE VISION OCR */
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

    if (!extractedText) {
      return res.status(400).json({ error: "No text detected in image" });
    }

    /* 🔹 STREAM HEADERS */
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    /* 🔹 2. GPT STREAM */
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Identify the subject(Whether Economics,Maths,English,Accounts,Business studies,Physics,Chemistry,Biology,History,Civics,Geography) and solve completely in CBSE exam style using only CBSE-approved methods and simple NCERT language. Use steps for numericals but only paragraphs for theory. Always use simple notation (no LaTeX at all, no frac, no {}, no √ use this √, use tan^-1 not arctan. Never leave any question incomplete or say it’s not in syllabus — always continue logically till the end and give a clean, simplified final answer. Format as: 📘 Subject: [auto] 📖 Chapter: [if clear] 📝 Step-by-step solution: Step 1: [Given info] Step 2: [Apply formula/law] 📌 Concept used: ✅ Final Answer: [for numericals only]. Keep language simple and CBSE-style.",
        },
        {
          role: "user",
          content: extractedText,
        },
      ],
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        res.write(token);
      }
    }

    res.end();

  } catch (err) {
    console.error("❌ Image processing error:", err.response?.data || err.message);
    res.end();
  }
});

module.exports = router;