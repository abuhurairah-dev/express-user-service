const express = require("express");
const router = express.Router();
const UserService = require("../services/userService");
const authMiddleware = require("../middleware/authMiddleware")

// Register route
router.post("/register", async (req, res, next) => {
  try {
    const user = await UserService.registerUser(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  try {
    const { token, user } = await UserService.loginUser(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// Profile route
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getProfile(req.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

// Forgot Password (request reset)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;   // ✅ extract email
    const result = await UserService.requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const result = await UserService.resetPassword({ token, newPassword });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
