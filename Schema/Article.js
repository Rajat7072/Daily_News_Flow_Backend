const mongoose = require("mongoose");
const { Schema } = mongoose;
const SubContent = require("./SubContent");
const QuestionContent = require("./QuestionContent");

const Article = new Schema({
  imagePrompt: {
    type: String,
  },
  heading: {
    type: String,
    required: true,
  },
  estimatedReadTime: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  SubContent: {
    type: [SubContent],
    required: true,
  },
  Questions: {
    type: [QuestionContent],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  publishedDate: {
    type: String,
    required: true,
  },
  closingStatement: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

const ArticleSchema = mongoose.model("ArticleSchema", Article);
module.exports = ArticleSchema;
