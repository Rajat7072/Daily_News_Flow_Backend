const express = require("express");
const router = express.Router();
const getLatestNewsPrompt = require("../Ai/GetLatestNewsPrompt");
const GetLatestNewsSchema = require("../Schema/GetLatestNews");
const llm = require("../Ai/llm");

router.delete("/getLatestNews", async (req, res) => {
  try {
    const response = await GetLatestNewsSchema.deleteMany({});
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
    await GetLatestNewsSchema.deleteMany({});
    const llm_prompt = getLatestNewsPrompt();
    const response = JSON.parse(await llm(llm_prompt));
    const saveLstestNews = await GetLatestNewsSchema.create({
      news_headlines: response.news_headlines,
    });
    return res
      .status(200)
      .send({ success: true, msg: "Latest News Saved Successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save news",
    });
  }
});

router.get("/getNewsUpdates", async (req, res) => {
  try {
    const response = await GetLatestNewsSchema.find({});
    return res.status(200).send({
      success: true,
      news_headlines: response[0].news_headlines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
});

module.exports = router;
