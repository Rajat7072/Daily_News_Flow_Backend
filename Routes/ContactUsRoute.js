const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const contact_us = require("../Schema/ContactUs");

const contactUsValidation = [
  body("name")
    .notEmpty()
    .isString()
    .withMessage("name must be a non-empty string"),
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("email must be a non-empty and valid email Address"),
  body("phone")
    .notEmpty()
    .isNumeric()
    .isLength({ min: 10, max: 10 })
    .withMessage("email must be a non-empty and valid email Address"),
  body("query")
    .notEmpty()
    .isString()
    .withMessage("Query must be a non-empty and valid email Address"),
];

router.post("/contactus", contactUsValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  try {
    const { name, email, phone, query } = req.body;
    const response = await contact_us.create({ name, email, phone, query });
    res.status(200).send({ success: true, msg: "We will contact you soon" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
