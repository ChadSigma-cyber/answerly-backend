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

router.get("/health", (req, res) => {
  res.status(200).send("OK");
});

router.post("/", async (req, res) => {
  try {
    const { text, extractedText } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text required",
      });
    }


    const cleanText = text.trim().toLowerCase();

    /* 🔍 1. CHECK CACHE FIRST */
    const { data: cached } = await supabase
      .from("questions")
      .select("answer")
      .eq("question", cleanText)
      .not("answer", "is", null)
      .limit(1)
      .single();

    if (cached?.answer) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(cached.answer);
      return res.end();
    }

    /* 📝 2. INSERT QUESTION (IF NOT EXISTS) */
    await supabase.from("questions").insert([
      {
        question: cleanText,
        extracted_text: extractedText || null,
        answer: null,
      },
    ]);

    /* 🌊 STREAM HEADERS */
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullAnswer = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Identify the subject(Whether Economics,Maths,English,Accounts,Business studies,Physics,Chemistry,Biology,History,Civics,Geography) and solve completely in CBSE exam style using only CBSE-approved methods and simple NCERT language. Use steps for numericals but only paragraphs for theory. Always use simple notation (no LaTeX at all, no frac, no {}, no sqrt use this √, use tan^-1 not arctan. Never leave any question incomplete or say it’s not in syllabus — always continue logically till the end and give a clean, simplified final answer. If the question is beyond CBSE, still solve it fully. For geometry questions, always derive lengths using Pythagoras theorem or CBSE-style constructions, never shortcuts. Do not leave substituted or unsimplified integrals as the final answer. Format as: 📘 Subject: [auto] 📖 Chapter: [if clear] 📝 Step-by-step solution: Step 1: [Given info] Step 2: [Apply formula/law] 📌 Concept used: ✅ Final Answer: [for numericals only]. Keep language simple, clear, CBSE-style, and end only with the final answer (no extra comments or text after). For equivalence-relation checks: internally reason before responding (do NOT display internal chain-of-thought); after that private reasoning, present only the single minimal example (or minimal examples) that demonstrate where the relation fails reflexivity, symmetry, or transitivity — do not show extra examples or tests. and do in theoritcal questions answer using paragraphs instead of steps and always take care of indian accoutning standards ,rules , partnership deed etc while solving accounts for example if nothing is given regarding deed and the question says the partner expects lets say a 10 percent interest on loan then ignore it and go according to partnership act which says if deed is silent then 6 percent on loan taken will be provided with no interest on capital or additional capital or drawings.dont make any answer messy leave space whenever required now solve this question:",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    /* 🌊 STREAM + BUILD ANSWER */
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        fullAnswer += token;
        res.write(token);
      }
    }

    /* 💾 3. SAVE FINAL ANSWER */
    await supabase
      .from("questions")
      .update({ answer: fullAnswer })
      .eq("question", cleanText);

    res.end();
  } catch (error) {
    console.error("AI Error:", error);
    res.end();
  }
});

module.exports = router;