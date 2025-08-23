require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

const { logger, stream } = require("./utils/logger");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(morgan("combined", { stream }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Service is running 🚀" });
});

app.use(errorHandler);

mongoose
  .connect(config.db.uri, { useNewUrlParser: true, useUnifiedTopology: true })
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

module.exports = app;
