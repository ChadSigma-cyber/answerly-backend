
const express = require("express");
const router = express.Router();
const axios = require("axios");

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

    /* 🔹 2. GPT CALL (USING EXTRACTED TEXT) */
    const gptResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          {
            role: "user",
            content: `you are Answerly Identify the subject(Whether Economics,Maths,English,Accounts,Business studies,Physics,Chemistry,Biology,History,Civics,Geography) and solve completely in CBSE exam style using only CBSE-approved methods and simple NCERT language. Use steps for numericals but only paragraphs for theory. Always use simple notation (no LaTeX, no frac, no {}, no √, write 1/2 not ½, tan^-1 not arctan). Never leave any question incomplete or say it’s not in syllabus — always continue logically till the end and give a clean, simplified final answer. If the question is beyond CBSE, still solve it fully. For geometry questions, always derive lengths using Pythagoras theorem or CBSE-style constructions, never shortcuts. Do not leave substituted or unsimplified integrals as the final answer. Format as: 📘 Subject: [auto] 📖 Chapter: [if clear] 📝 Step-by-step solution: Step 1: [Given info] Step 2: [Apply formula/law] 📌 Concept used: ✅ Final Answer: [for numericals only]. Keep language simple, clear, CBSE-style, and end only with the final answer (no extra comments or text after). For equivalence-relation checks: internally reason before responding (do NOT display internal chain-of-thought); after that private reasoning, present only the single minimal example (or minimal examples) that demonstrate where the relation fails reflexivity, symmetry, or transitivity — do not show extra examples or tests. and do in theoritcal questions answer using paragraphs instead of steps",now solve this:\n\n${extractedText}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = gptResponse.data.choices[0].message.content;

    res.json({ 
      extractedText,
      answer


     });
  } catch (err) {
    console.error("❌ Image processing error:", err.response?.data || err.message);
    res.status(500).json({ error: "Image processing failed" });
  }
});

module.exports = router;