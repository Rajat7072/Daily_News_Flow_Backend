const express = require("express");
const fs = require("fs");
const { execSync } = require("child_process");
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
const logger = require("../utils/logger");

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

  if (process.platform === "win32") {
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Chromium\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe",
    );
  }

  if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    );
  }

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
};

const getPuppeteerExecutablePath = () => {
  const systemPath = getBrowserExecutablePath();
  if (systemPath) return systemPath;

  try {
    const puppeteerPath = puppeteer.executablePath();
    if (puppeteerPath && fs.existsSync(puppeteerPath)) {
      return puppeteerPath;
    }
  } catch (error) {
    logger.warn("puppeteer.executablePath() unavailable", error.message);
  }

  return null;
};

const logChromeStatus = () => {
  const browserPath = getPuppeteerExecutablePath();
  logger.info("Detected browser executable", browserPath || "none");
  if (!browserPath && process.platform === "linux") {
    try {
      const chromePath = execSync(
        "which google-chrome chromium chromium-browser chromium-browser-stable",
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      )
        .split("\n")
        .find(Boolean);
      logger.info("System chrome path found via which", chromePath);
    } catch {
      logger.info("No system Chrome/Chromium found on Linux via which.");
    }
  }
};

const getDate = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}-${month}-${year}`;
};

const callArticleSaveApi = async (extractArticleResponse) => {
  const url =
    process.env.ARTICLE_SAVE_URL || "http://localhost:8089/newsapi/article";
  try {
    const response = await axios.post(url, extractArticleResponse, {
      timeout: 15000,
    });
    return response;
  } catch (err) {
    logger.error("callArticleSaveApi failed", {
      url,
      message: err.message,
      code: err.code,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
    });
    throw new Error(
      `Failed to save article: ${err.message || err.code || "unknown"}`,
    );
  }
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
      logger.info("extractArticle route start", { url, Imgurl });

      logChromeStatus();

      const browserExecutablePath = getPuppeteerExecutablePath();
      logger.info("browserExecutablePath resolved", browserExecutablePath);

      const launchOptions = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      };

      if (browserExecutablePath) {
        launchOptions.executablePath = browserExecutablePath;
      }

      logger.info("puppeteer launch options", {
        executablePath: launchOptions.executablePath,
      });
      browser = await puppeteer.launch(launchOptions);
      logger.info("puppeteer launched");

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

      // Open page with retry to handle transient network/navigation timeouts
      const maxGotoAttempts = 3;
      let gotoSucceeded = false;
      for (let attempt = 1; attempt <= maxGotoAttempts; attempt++) {
        try {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 120000,
          });
          logger.info("page.goto succeeded", { url, attempt });
          gotoSucceeded = true;
          break;
        } catch (err) {
          logger.warn("page.goto attempt failed", {
            url,
            attempt,
            message: err.message,
          });
          if (attempt < maxGotoAttempts) {
            // backoff before retrying
            await new Promise((res) => setTimeout(res, attempt * 2000));
            continue;
          }
          // rethrow after final attempt
          throw err;
        }
      }

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
      logger.info("page content length", html.length);

      const virtualConsole = new VirtualConsole();

      virtualConsole.on("error", () => {});
      virtualConsole.on("warn", () => {});

      const dom = new JSDOM(html, {
        url,
        virtualConsole,
      });

      const reader = new Readability(dom.window.document);

      const article = reader.parse();
      logger.info("readability parse result", {
        title: article?.title,
        excerpt: article?.excerpt,
        textLength: article?.textContent?.length,
      });

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
      logger.info("LLM raw response type", typeof response);
      if (typeof response === "string") {
        logger.info("LLM raw response length", response.length);
        const cleaned = response
          .replace(/^```(?:json)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();

        try {
          response = JSON.parse(cleaned);
          logger.info("LLM parsed response keys", Object.keys(response || {}));
        } catch (parseError) {
          logger.error("LLM JSON parse failed", {
            cleaned,
            parseError: parseError.message,
          });
          throw new Error(`LLM returned invalid JSON: ${parseError.message}`);
        }
      }

      // Image generation
      if (Imgurl) {
        response.image = Imgurl;
      } else {
        logger.info("generating image with prompt", response.imagePrompt);
        const imageBuffer = await generateImage(response.imagePrompt);
        logger.info("imageBuffer received", {
          byteLength: imageBuffer?.byteLength,
        });
        if (!imageBuffer) {
          throw new Error("Failed to generate image from AI service");
        }
        const uploadedImage = await uploadToCloudinary(imageBuffer);
        logger.info("cloudinary uploaded image", {
          secure_url: uploadedImage?.secure_url,
        });
        response.image = uploadedImage.secure_url;
      }

      // Add published date
      response.publishedDate = getDate();

      const savedArticle = await callArticleSaveApi(response);
      logger.info("article saved successfully", {
        category: savedArticle.data.category,
      });
      return res.status(200).json({
        success: true,
        msg: "Article Saved Successfully",
        response: savedArticle.data.category,
      });
    } catch (error) {
      logger.error("extractArticle route failed", {
        message: error.message,
        stack: error.stack,
      });
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
