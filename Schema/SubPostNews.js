const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubPostNews = new Schema({
  heading: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  Link: {
    type: String,
    required: true,
  },
});

module.exports = SubPostNews;
