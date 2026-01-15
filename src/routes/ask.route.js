const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text required",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: [
        {
          role: "system",
          content: "Identify the subject(Whether Economics,Maths,English,Accounts,Business studies,Physics,Chemistry,Biology,History,Civics,Geography) and solve completely in CBSE exam style using only CBSE-approved methods and simple NCERT language. Use steps for numericals but only paragraphs for theory. Always use simple notation (no LaTeX, no frac, no {}, no √, write 1/2 not ½, tan^-1 not arctan). Never leave any question incomplete or say it’s not in syllabus — always continue logically till the end and give a clean, simplified final answer. If the question is beyond CBSE, still solve it fully. For geometry questions, always derive lengths using Pythagoras theorem or CBSE-style constructions, never shortcuts. Do not leave substituted or unsimplified integrals as the final answer. Format as: 📘 Subject: [auto] 📖 Chapter: [if clear] 📝 Step-by-step solution: Step 1: [Given info] Step 2: [Apply formula/law] 📌 Concept used: ✅ Final Answer: [for numericals only]. Keep language simple, clear, CBSE-style, and end only with the final answer (no extra comments or text after). For equivalence-relation checks: internally reason before responding (do NOT display internal chain-of-thought); after that private reasoning, present only the single minimal example (or minimal examples) that demonstrate where the relation fails reflexivity, symmetry, or transitivity — do not show extra examples or tests. and do in theoritcal questions answer using paragraphs instead of steps",
        
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