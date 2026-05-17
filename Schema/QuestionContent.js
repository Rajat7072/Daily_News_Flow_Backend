const mongoose = require("mongoose");
const { Schema } = mongoose;

const QuestionContent = new Schema({
  Q: { type: String, required: true },
  A: { type: String, required: true },
});

module.exports = QuestionContent;
