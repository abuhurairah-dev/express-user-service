require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const logger = require("./utils/logger");
const config = require("./config");

if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(config.db.uri)
    .then(() => {
      logger.info("✅ Connected to MongoDB");
      app.listen(config.app.port, () =>
        logger.info(`🚀 Server running on port ${config.app.port}`)
      );
    })
    .catch((err) => {
      logger.error("❌ MongoDB connection failed", err);
      process.exit(1);
    });
}

module.exports = app;
