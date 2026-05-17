const mongoose = require("mongoose");
const dns = require("dns").promises;

const mongoDBConnect = async () => {
  try {
    if (process.env.ENVIRONMENT === "development") {
      // Fix DNS resolution issue - set explicit DNS servers
      dns.setServers(["1.1.1.1", "8.8.8.8"]);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
    return conn;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = mongoDBConnect;
