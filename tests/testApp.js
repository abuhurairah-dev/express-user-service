const express = require("express");
const mongoose = require("mongoose");
const UserService = require("../src/services/userService");
const userRoutes = require("../src/routes/userRoutes");

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Configure UserService for tests
  UserService.configure({
    jwtSecret: "testsecret",
    jwtExpiresIn: "1h",
    emailProvider: { sendMail: jest.fn().mockResolvedValue(true) },
    dbConnection: mongoose.connection,
  });

  app.use("/api/users", userRoutes);

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("Test error:", err);
    res.status(500).json({ success: false, message: err.message });
  });

  return app;
}

module.exports = createTestApp;
