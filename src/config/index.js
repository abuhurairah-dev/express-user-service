require("dotenv").config();

const config = {
  app: {
    port: process.env.PORT || 3000,
  },
  db: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/user_service",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "supersecret",
    jwtExpiry: process.env.JWT_EXPIRY || "1h",
  },
};

module.exports = config;
