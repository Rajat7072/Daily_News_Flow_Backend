const mongoose = require("mongoose");

const NewsCountSchema = new mongoose.Schema({
  total: {
    type: Number,
    default: 0,
  },

  categories: {
    Science: { type: Number, default: 0 },
    Politics: { type: Number, default: 0 },
    Technology: { type: Number, default: 0 },
    Sports: { type: Number, default: 0 },
    Research: { type: Number, default: 0 },
    Education: { type: Number, default: 0 },
    Business: { type: Number, default: 0 },
    Health: { type: Number, default: 0 },
    Environment: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model("NewsCount", NewsCountSchema);
