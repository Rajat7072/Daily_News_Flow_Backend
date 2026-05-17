const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactus = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
});

const contact_us = mongoose.model("contact_us", contactus);
module.exports = contact_us;
