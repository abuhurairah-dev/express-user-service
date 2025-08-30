const express = require("express");
const UserService = require("../services/userService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/** Register */
router.post("/register", async (req, res) => {
  try {
    const user = await UserService.register(req.body);
    const { token } = await UserService.login({
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Login */
router.post("/login", async (req, res) => {
  try {
    const result = await UserService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Me */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await UserService.me(req.userId);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Forgot password */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const token = await UserService.forgotPassword(email);
    if (process.env.NODE_ENV === "test") {
      return res.json({ message: "Reset email sent", token });
    }
    res.json({ message: "Reset email sent" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Reset password */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await UserService.resetPassword(token, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
