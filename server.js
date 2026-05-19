const express = require("express");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
dotenv.config();
const app = express();
const cors = require("cors");
const ExtractArticleRoute = require("./Routes/ExtractArticleRoute");
const UploadImageRoute = require("./Routes/UploadImageRoute");
const ArticleRoute = require("./Routes/ArticleRoute");
const GetLatestNewsRoute = require("./Routes/GetLatestNewsRoute");
const ContactUsRoute = require("./Routes/ContactUsRoute");

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const connectToDB = require("./db");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json());
app.use(
  cors({
    origin: [process.env.ALLOWED_URL, process.env.ALLOWED_URL_2],
  }),
);

app.use("/api", ExtractArticleRoute);
app.use("/api", UploadImageRoute);
app.use("/api", ArticleRoute);
app.use("/api", GetLatestNewsRoute);
app.use("/api", ContactUsRoute);

app.use("/health", (req, res) => {
  res.status(200).send({ success: true, health: "success" });
});

app.listen(port, host, () => {
  connectToDB();
  console.log("Server Started Successfully");
});
