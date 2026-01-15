const express = require("express");
const { askImage } = require("./controllers/askImageController");

const router = express.Router();

router.post("/ask-image", askImage);

module.exports = router;
console.log("OCR TEXT:", extractedText.slice(0, 200));