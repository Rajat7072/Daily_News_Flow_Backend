const mongoose = require("mongoose");
const { Schema } = mongoose;

const Extract_Article = new Schema({
  url: {
    type: String,
    required: true,
  },
});
const ExtractArticleSchema = mongoose.model(
  "ExtractArticleSchema",
  Extract_Article,
);
module.exports = ExtractArticleSchema;
