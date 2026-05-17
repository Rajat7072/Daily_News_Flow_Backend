const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubContent = new Schema({
  heading: {
    type: String,
    required: true,
  },
  subSummary: {
    type: String,
    required: true,
  },
  bulletPoints: {
    type: [String],
    required: true,
  },
});
module.exports = SubContent;
