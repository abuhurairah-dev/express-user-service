const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
require("dotenv").config();

class UserService {
  static emailSender = null;

  // Client must configure this once when app starts
  static configure({ sendEmail }) {
    this.emailSender = sendEmail;
  }

  static async registerUser({ name, email, password }) {
    if (!name) {
      const err = new Error("Name is required");
      err.statusCode = 400;
      throw err;
    }
    if (name.length < 2) {
      const err = new Error("Name must be at least 2 characters long");
      err.statusCode = 400;
      throw err;
    }
    if (!email) {
      const err = new Error("Email is required");
      err.statusCode = 400;
      throw err;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      const err = new Error("Please use a valid email address");
      err.statusCode = 400;
      throw err;
    }
    if (!password) {
      const err = new Error("Password is required");
      err.statusCode = 400;
      throw err;
    }
    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters long");
      err.statusCode = 400;
      throw err;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error("User with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    // pass plain password, let schema handle hashing
    const user = new User({ name, email, password });
    return user.save();
  }

  static async loginUser({ email, password }) {
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    // sign token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  static async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  // 🔑 Forgot password flow
  static async requestPasswordReset(email) {
    if (!email) {
      const err = new Error("Email is required");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("No user with that email");
      err.statusCode = 404;
      throw err;
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save();

    if (!this.emailSender) {
      throw new Error("Email sender not configured. Please call UserService.configure()");
    }

    await this.emailSender({
      to: user.email,
      subject: "Password Reset",
      html: `<p>Click <a href="${process.env.FRONTEND_CLIENT_URL}/reset-password/${token}">here</a> to reset your password</p>`,
    });

    return { success: true, message: "Reset email sent" };
  }

  static async resetPassword({ token, newPassword }) {
    if (!token || !newPassword) {
      const err = new Error("Token and new password are required");
      err.statusCode = 400;
      throw err;
    }

    // hash the token the same way we saved it
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });    

    if (!user) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = 400;
      throw err;
    }

    // update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: "Password has been reset successfully" };
  }
}

module.exports = UserService;
