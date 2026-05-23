const mongoose = require("mongoose");
const { Schema } = mongoose;
const SubPostNews = require("./SubPostNews");

const PostLatestNews = new Schema({
  news_headlines: {
    type: [SubPostNews],
    required: true,
    default: [],
  },
});

const PostLatestNewsSchema = mongoose.model(
  "PostLatestNewsSchema",
  PostLatestNews,
);
module.exports = PostLatestNewsSchema;
