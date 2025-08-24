const express = require("express");
const UserService = require("../services/userService");

const router = express.Router();

// POST /api/users/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await UserService.registerUser({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
