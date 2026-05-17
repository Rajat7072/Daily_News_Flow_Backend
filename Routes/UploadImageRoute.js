const express = require("express");
const multer = require("multer");
const uploadToCloudinary = require("../uploadImage/uploadImage");
const router = require("./ExtractArticleRoute");
const upload = multer(); // memory storage

router.post("/upload", upload.single("myFile"), async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer);
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
