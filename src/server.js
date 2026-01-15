const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const askRoutes = require("./routes/ask.route");
const askImageRoutes = require("./routes/askImageRoutes");

const app = express();


app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/ask", askRoutes);
app.use("/api/ask-image", askImageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});