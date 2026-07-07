const express = require("express");
const fs = require("fs");
const router = express.Router();
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const { Readability } = require("@mozilla/readability");
const { JSDOM, VirtualConsole } = require("jsdom");

// IMPORTANT CHANGES
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const extractArticlePrompt = require("../Ai/ExtractArticlePrompt");
const llm = require("../Ai/llm");
const generateImage = require("../Ai/generateImagePrompt");
const uploadToCloudinary = require("../uploadImage/uploadImage");

const getBrowserExecutablePath = () => {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [];

  if (envPath) {
    candidates.push(envPath);
  }

  if (process.platform === "linux") {
    candidates.push(
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/snap/bin/chromium",
    );
  }

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
};

const getDate = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}-${month}-${year}`;
};

const callArticleSaveApi = async (extractArticleResponse) => {
  const response = await axios.post(
    "http://localhost:8089/newsapi/article",
    extractArticleResponse,
  );

  return response;
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

      const browserExecutablePath = getBrowserExecutablePath();

      if (!browserExecutablePath) {
        throw new Error(
          "No Chrome/Chromium executable found. Install Chromium or set PUPPETEER_EXECUTABLE_PATH.",
        );
      }

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        executablePath: browserExecutablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      const page = await browser.newPage();

      // Real browser user-agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );

      // Realistic viewport
      await page.setViewport({
        width: 1366,
        height: 768,
      });

      // Extra headers
      await page.setExtraHTTPHeaders({
        "accept-language": "en-US,en;q=0.9",
      });

      // Open page
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      // Wait like human
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Remove unnecessary elements
      await page.evaluate(() => {
        const elements = document.querySelectorAll(
          `
          script,
          style,
          nav,
          footer,
          header,
          iframe,
          ads,
          .ads,
          .advertisement,
          .popup,
          .cookie-banner
        `,
        );

        elements.forEach((el) => el.remove());
      });

      // Get cleaned HTML
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

      // Validation
      if (!article) {
        throw new Error("Failed to extract article");
      }

      // Clean article
      const cleanedArticle = {
        title: article.title || "",
        excerpt: article.excerpt || "",
        textContent: article.textContent || "",
      };

      // Build prompt
      const llm_prompt = `${extractArticlePrompt()}ARTICLE DATA:${JSON.stringify(cleanedArticle, null, 2)}`;
      // LLM
      let response = await llm(llm_prompt);
      // Parse string response
      if (typeof response === "string") {
        // Remove markdown code blocks if present
        response = response
          .replace(/^```(?:json)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "");
        response = JSON.parse(response);
      }

      // Image generation
      if (Imgurl) {
        response.image = Imgurl;
      } else {
        const imageBuffer = await generateImage(response.imagePrompt);
        //console.log("Buffer", imageBuffer);
        if (!imageBuffer) {
          throw new Error("Failed to generate image from AI service");
        }
        const uploadedImage = await uploadToCloudinary(imageBuffer);
        response.image = uploadedImage.secure_url;
      }

      // Add published date
      response.publishedDate = getDate();

      const savedArticle = await callArticleSaveApi(response);
      //console.log("Saved", savedArticle);
      return res.status(200).json({
        success: true,
        msg: "Article Saved Successfully",
        response: savedArticle.data.category,
      });
    } catch (error) {
      //console.log("This Error", error);
      return res.status(500).json({
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
