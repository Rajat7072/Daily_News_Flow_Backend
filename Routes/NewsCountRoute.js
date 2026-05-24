const express = require("express");
const router = express.Router();
const NewsCount = require("../Schema/NewsCount");

router.put("/count", async (req, res) => {
  try {
    const { params, type } = req.body;
    let response;
    if (type === "Increase") {
      response = await NewsCount.updateOne(
        {},
        {
          $inc: {
            total: 1,
            [`categories.${params}`]: 1,
          },
        },
        { upsert: true },
      );
    } else if (type === "Decrease") {
      response = await NewsCount.updateOne(
        {},
        {
          $inc: {
            total: -1,
            [`categories.${params}`]: -1,
          },
        },
        { upsert: true },
      );
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const counts = await NewsCount.findOne({});
    res.status(200).json({ success: true, count: counts });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
