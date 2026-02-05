const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

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

    // ✅ ONLY JSON
    return res.json({ extractedText });

  } catch (err) {
    console.error("OCR error:", err);
    return res.status(500).json({ error: "OCR failed" });
  }
});

module.exports = router;