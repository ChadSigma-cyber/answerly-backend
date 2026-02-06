const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.post("/", async (req, res) => {
  const { text, extractedText } = req.body;

  if (!text) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("Error: No text provided");
    return res.end();
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  res.write(" "); // kickstart stream

  supabase.from("questions").insert([
    { question: text, extracted_text: extractedText || null }
  ]).catch(console.error);

  try {
    const stream = await client.responses.stream({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: "YOUR PROMPT" },
        { role: "user", content: text }
      ]
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(event.delta);
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.write("Error generating answer");
    res.end();
  }
});
module.exports = router;
