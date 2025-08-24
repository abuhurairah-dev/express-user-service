const express = require("express");
const router = express.Router();
const UserService = require("../services/userService");

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

module.exports = router;
