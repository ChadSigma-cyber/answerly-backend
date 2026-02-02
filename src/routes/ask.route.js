const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js"); // ✅ ADD

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ ADD
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.post("/", async (req, res) => {
  try {
    const { text, extractedText } = req.body; // ✅ CHANGE (add extractedText)

    if (!text) {  
      return res.status(400).json({
        success: false,
        message: "Text required",
      });
    }

    // ✅ ADD: store user input
    await supabase.from("questions").insert([
      {
        question: text,
        extracted_text: extractedText || null,
      }
    ]);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "Identify the subject (Economics, Maths, English, Accounts, Business Studies, Physics, Chemistry, Biology, History, Civics, Geography) and solve completely in CBSE exam style using only CBSE-approved methods and simple NCERT language; use steps for numericals and paragraphs for theory; write all mathematical expressions using LaTeX (fractions, roots, integrals, powers, tan^{-1}), use only familiar CBSE formulas and avoid advanced factorisations like 1 + t^4 = (t^2 + \sqrt{2} t + 1)(t^2 - \sqrt{2} t + 1); never leave any question incomplete or say out of syllabus, always continue logically till the end and give a clean, simplified final answer even if beyond CBSE; for geometry always derive using Pythagoras theorem or CBSE-style constructions, never shortcuts; do not leave substituted or unsimplified integrals as final answer; format strictly as 📘 Subject: [auto] 📖 Chapter: [if clear] 📝 Step-by-step solution: Step 1: [Given info] Step 2: [Apply formula or law] 📌 Concept used: ✅ Final Answer: [numericals only]; for equivalence-relation checks internally reason but do not show chain-of-thought and give only the single minimal example(s) showing failure of reflexivity, symmetry or transitivity; for theoretical questions answer only in paragraphs; always follow Indian accounting standards and partnership rules, and if deed is silent ignore “expects” and apply Partnership Act with 6 percent interest on loan and no interest on capital, drawings or additional capital; end only with the final answer with no extra comments. and keep each step short and simple, avoiding long algebraic expressions in a single step use space after each step too. now solve this:",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return res.json({
      success: true,
      question: text,
      answer,
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({
      success: false,
      message: "AI failed",
    });
  }
});

module.exports = router;