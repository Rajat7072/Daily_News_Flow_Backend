const express = require("express");
const router = express.Router();
const getLatestNewsPrompt = require("../Ai/GetLatestNewsPrompt");
const GetLatestNewsSchema = require("../Schema/GetLatestNews");
const llm = require("../Ai/llm");

const parseNewsHeadlines = (rawResponse) => {
  if (Array.isArray(rawResponse)) {
    return rawResponse.filter(
      (item) => typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof rawResponse !== "string") {
    if (rawResponse?.news_headlines) {
      return parseNewsHeadlines(rawResponse.news_headlines);
    }
    return [];
  }

  const trimmed = rawResponse.trim();
  if (!trimmed) {
    return [];
  }

  let cleaned = trimmed;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => typeof item === "string" && item.trim().length > 0,
      );
    }
    if (parsed?.news_headlines) {
      return parseNewsHeadlines(parsed.news_headlines);
    }
  } catch (error) {
    // Ignore parse failures and fall back to line-based extraction.
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\.\s*/, "")
        .trim(),
    )
    .filter(Boolean);

  if (lines.length > 0) {
    return lines;
  }

  return [cleaned];
};

const normalizeNewsItems = (payload) => {
  const incomingNews = Array.isArray(payload)
    ? payload
    : (payload?.news_headlines ?? payload);

  if (!Array.isArray(incomingNews) || incomingNews.length === 0) {
    return null;
  }

  return incomingNews
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.heading ?? item?.title ?? item?.news ?? "";
    })
    .filter((item) => typeof item === "string" && item.trim().length > 0);
};

router.delete("/getLatestNews", async (req, res) => {
  try {
    await GetLatestNewsSchema.deleteMany({});
    return res
      .status(200)
      .send({ success: true, msg: "Latest News deleted Successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete news",
    });
  }
});
router.get("/getLatestNews", async (req, res) => {
  try {
    // console.log("[getLatestNews] GET request received");
    await GetLatestNewsSchema.deleteMany({});
    // console.log("[getLatestNews] Cleared old records");

    const llm_prompt = getLatestNewsPrompt();
    // console.log("[getLatestNews] LLM prompt generated");

    const llmResponse = await llm(llm_prompt);
    // console.log("[getLatestNews] LLM response received", llmResponse);

    let response;
    try {
      response =
        typeof llmResponse === "string" ? JSON.parse(llmResponse) : llmResponse;
    } catch (parseError) {
      response = llmResponse;
    }

    if (response?.success === false) {
      return res.status(502).json({
        success: false,
        message: response.msg || "AI request failed",
        details: response.error,
      });
    }

    const parsedHeadlines = parseNewsHeadlines(
      response?.news_headlines ?? response,
    );

    if (parsedHeadlines.length === 0) {
      return res.status(502).json({
        success: false,
        message: "AI response did not contain any headlines",
        details: llmResponse,
      });
    }

    const normalizedNews = normalizeNewsItems(parsedHeadlines);
    if (!normalizedNews || normalizedNews.length === 0) {
      return res.status(502).json({
        success: false,
        message: "AI response did not contain valid headlines",
        details: llmResponse,
      });
    }

    // console.log("[getLatestNews] Parsed response", normalizedNews);

    const saveLatestNews = await GetLatestNewsSchema.create({
      news_headlines: normalizedNews,
    });
    // console.log("[getLatestNews] Saved to DB", saveLatestNews);

    return res
      .status(200)
      .send({ success: true, msg: "Latest News Saved Successfully" });
  } catch (error) {
    console.error("[getLatestNews] GET flow failed", error);
    res.status(500).json({
      success: false,
      message: "Failed to save news",
    });
  }
});

router.post("/getLatestNews", async (req, res) => {
  try {
    // console.log("[getLatestNews] POST request received");
    // console.log("[getLatestNews] Request body", req.body);

    const normalizedNews = normalizeNewsItems(req.body);
    if (!normalizedNews || normalizedNews.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Use GET /getLatestNews to generate and save latest news",
      });
    }

    await GetLatestNewsSchema.deleteMany({});
    // console.log("[getLatestNews] Cleared old post records");

    const saveLatestNews = await GetLatestNewsSchema.create({
      news_headlines: normalizedNews,
    });
    // console.log("[getLatestNews] Saved POST payload to DB", saveLatestNews);

    return res
      .status(200)
      .send({ success: true, msg: "Latest News Saved Successfully" });
  } catch (error) {
    console.error("[getLatestNews] POST flow failed", error);
    res.status(500).json({
      success: false,
      message: "Failed to save news",
    });
  }
});

router.get("/getNewsUpdates", async (req, res) => {
  try {
    // console.log("[getNewsUpdates] Fetch request received");
    const response = await GetLatestNewsSchema.find({});
    // console.log("[getNewsUpdates] DB response", response);

    return res.status(200).send({
      success: true,
      news_headlines: response[0]?.news_headlines ?? [],
    });
  } catch (error) {
    console.error("[getNewsUpdates] Fetch flow failed", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
});

module.exports = router;
