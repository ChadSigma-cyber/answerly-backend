exports.askQuestion = async (req, res) => {
  try {
    const { text, imageBase64 } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Text or image is required",
      });
    }

    // TEMP RESPONSE (we'll add AI later)
    return res.json({
      success: true,
      question: text || "Image question",
      answer: "AI response will come here",
    });

  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
