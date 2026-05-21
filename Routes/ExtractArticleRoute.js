const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Readability } = require("@mozilla/readability");
const { JSDOM, VirtualConsole } = require("jsdom");
const puppeteer = require("puppeteer");
const extractArticlePrompt = require("../Ai/ExtractArticlePrompt");
const llm = require("../Ai/llm");
const generateImage = require("../Ai/generateImagePrompt");
const uploadToCloudinary = require("../uploadImage/uploadImage");

const getDate = () => {
  const now = new Date();
  // Extract day, month, year
  const day = String(now.getDate()).padStart(2, "0"); // ensures 2 digits
  const month = String(now.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const year = now.getFullYear();
  // Combine into DD-MM-YYYY
  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
};
router.post(
  "/extractArticle",
  [body("url", "Please enter a valid URL").isURL()],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    let browser;

    try {
      const { url, Imgurl } = req.body;

      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const html = await page.content();
      const virtualConsole = new VirtualConsole();

      virtualConsole.on("error", () => {});
      virtualConsole.on("warn", () => {});

      const dom = new JSDOM(html, {
        url,
        virtualConsole,
      });

      const reader = new Readability(dom.window.document);

      const article = reader.parse();

      //Call prompt and llm
      const cleanedArticle = {
        title: article.title,
        excerpt: article.excerpt,
        textContent: article.textContent,
      };
      const llm_prompt = `${extractArticlePrompt()}ARTICLE DATA:${JSON.stringify(cleanedArticle, null, 2)}`;

      const response = JSON.parse(await llm(llm_prompt));
      if (Imgurl) {
        response.image = Imgurl;
      } else {
        const imageBuffer = await generateImage(response.imagePrompt);

        if (!imageBuffer) {
          throw new Error("Failed to generate image from AI service");
        }

        const uploadedImage = await uploadToCloudinary(imageBuffer);
        response.image = uploadedImage.secure_url;
      }
      response.publishedDate = getDate();

      return res.json({
        success: true,
        response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
);

module.exports = router;
