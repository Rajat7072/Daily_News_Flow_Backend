const { body } = require("express-validator");
const express = require("express");
const router = express.Router();
const ArticleSchema = require("../Schema/Article");
const { query } = require("express-validator");
const { validationResult } = require("express-validator");

// Validation rules for article response
const articleValidationRules = [
  body("imagePrompt")
    .isString()
    .notEmpty()
    .withMessage("imagePrompt must be a non-empty string"),

  body("heading").isString().notEmpty().withMessage("heading is required"),

  body("content")
    .isString()
    .isLength({ max: 2000 })
    .withMessage("content must be a string up to 1000 characters"),

  body("closingStatement")
    .isString()
    .notEmpty()
    .withMessage("closingStatement is required"),

  body("category")
    .notEmpty()
    .isString()
    .withMessage("category must be present")

    .withMessage("category must be one of the predefined values"),

  body("SubContent").isArray().withMessage("SubContent must be an array items"),

  body("SubContent.*.heading")
    .isString()
    .notEmpty()
    .withMessage("Each SubContent item must have a heading"),

  body("SubContent.*.subSummary")
    .isString()
    .notEmpty()
    .withMessage("Each SubContent item must have a subSummary"),

  body("SubContent.*.bulletPoints")
    .isArray()
    .withMessage("bulletPoints must be an array with max 5 items"),

  body("Questions").isArray().withMessage("Questions must be an array items"),

  body("Questions.*.Q")
    .isString()
    .notEmpty()
    .withMessage("Each question must have a Q field"),

  body("Questions.*.A")
    .isString()
    .notEmpty()
    .withMessage("Each question must have an A field"),
];

router.post("/article", articleValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const response = await ArticleSchema.create(req.body);
    return res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get(
  "/article",
  [
    query("category")
      .optional()
      .isIn([
        "Science",
        "Politics",
        "Technology",
        "Sports",
        "Research",
        "Education",
        "Business",
        "Health",
        "Environment",
      ])
      .withMessage("Invalid category"),
    query("heading")
      .optional()
      .isString()
      .withMessage("Please Enter the valid Heading to Search"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 10;
      let skip = (page - 1) * limit;
      const { category, heading } = req.query;
      let filter = {};

      if (category) {
        filter = { category };
      } else if (heading) {
        filter = { heading };
      }

      const articles = await ArticleSchema.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 });
      res.status(200).json({ success: true, articles: articles });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);
router.put("/article", articleValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const articles = await ArticleSchema.findByIdAndUpdate(
      req.body._id,
      req.body,
      { new: true },
    );

    res
      .status(200)
      .json({ success: true, msg: "Article Updated Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/article", async (req, res) => {
  try {
    const { params } = req.body;
    const response = await ArticleSchema.findOneAndDelete({
      heading: params,
    });
    if (!response) {
      return res.status(404).json({ success: false, msg: "Article not found" });
    }
    response.msg = "Article Deleted Successfully";
    res.status(200).json(response);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
});
module.exports = router;
