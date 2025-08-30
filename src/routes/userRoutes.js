const express = require("express");
const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

const router = express.Router();

/** Middleware to protect routes */
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  jwt.verify(token, UserService.jwtSecret, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.userId = decoded.id;
    next();
  });
}

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
