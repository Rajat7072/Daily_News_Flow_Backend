const mongoose = require("mongoose");
const { Schema } = mongoose;

const GetLatestNews = new Schema({
  news_headlines: {
    type: [String],
    required: true,
    default: [],
  },
});

const GetLatestNewsSchema = mongoose.model(
  "GetLatestNewsSchema",
  GetLatestNews,
);
module.exports = GetLatestNewsSchema;
