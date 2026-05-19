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

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://www.dailynewsflow.com",
    "https://dailynewsflow.com",
  ];
  const origin = req.headers.origin;
  console.log("origin", origin);
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200); // respond to preflight
    }
    next();
  } else {
    return res.status(403).send("UnAuthorised Access");
  }
});

// app.use(
//   cors({
//     origin: [process.env.ALLOWED_URL, process.env.ALLOWED_URL_2],
//   }),
// );

app.use("/newsapi", ExtractArticleRoute);
app.use("/newsapi", UploadImageRoute);
app.use("/newsapi", ArticleRoute);
app.use("/newsapi", GetLatestNewsRoute);
app.use("/newsapi", ContactUsRoute);

app.use("/health", (req, res) => {
  res.status(200).send({ success: true, health: "success" });
});

app.listen(port, host, () => {
  connectToDB();
  console.log("Server Started Successfully");
});
