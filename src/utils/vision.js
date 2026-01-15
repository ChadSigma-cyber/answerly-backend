const axios = require("axios");

async function extractTextFromImage(base64Image) {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.VISION_API_KEY}`;

  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: {
          languageHints: ["en", "hi"],
        },
      },
    ],
  };

  const response = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
  });

  const text =
    response.data?.responses?.[0]?.fullTextAnnotation?.text;

  return text || "";
}

module.exports = { extractTextFromImage };