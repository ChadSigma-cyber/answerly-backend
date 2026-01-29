const fetch = require("node-fetch");
const sharp = require("sharp");

async function extractTextFromImage(base64Image) {

  const imageBuffer = Buffer.from(base64Image, "base64");

  // 🔥 Preprocess image
  const processedBuffer = await sharp(imageBuffer)
    .grayscale()          // remove colors
    .normalize()          // improve contrast
    .sharpen()            // sharpen text
    .resize({ width: 1500 }) // upscale if small
    .toBuffer();

  const processedBase64 = processedBuffer.toString("base64");
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;

  const body = {
    requests: [
      {
        image: {
          content: processedBase64,
        },
        features: [
          {
            type: "DOCUMENT_TEXT_DETECTION",
          },
        ],
        imageContext: {
          languageHints: ["en", "hi"],
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true
          }
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Vision API error:", data);
    throw new Error("Vision API failed");
  }

  return (
    data?.responses?.[0]?.fullTextAnnotation?.text || ""
  );
}

module.exports = { extractTextFromImage };