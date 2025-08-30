const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createUserModel } = require("../models/User");

class UserService {
  static jwtSecret = null;
  static jwtExpiresIn = "1h";
  static emailProvider = null;
  static User = null;
  static db = null;

  /** Configure service once at app startup */
  static async configure({
    jwtSecret,
    jwtExpiresIn = "1h",
    emailProvider,
    dbUri,
    dbConnection,
    userSchemaExtension,
  }) {
    if (!jwtSecret) throw new Error("JWT secret is required");

    if (!emailProvider || typeof emailProvider.sendMail !== "function") {
      throw new Error("Email provider with sendMail(to, subject, text) is required");
    }

    if (dbConnection) {
      UserService.db = dbConnection;
    } else if (dbUri) {
      UserService.db = await mongoose.connect(dbUri);
    } else {
      throw new Error("Either dbUri or dbConnection is required");
    }

    UserService.jwtSecret = jwtSecret;
    UserService.jwtExpiresIn = jwtExpiresIn;
    UserService.emailProvider = emailProvider;
    UserService.User = createUserModel(userSchemaExtension);
  }

  /** Register */
  static async register({ name, email, password, ...rest }) {
    const existing = await UserService.User.findOne({ email });
    if (existing) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserService.User({
      name,
      email,
      password: hashedPassword,
      ...rest,
    });
    await user.save();

    return user;
  }

  /** Login */
  static async login({ email, password }) {
    const user = await UserService.User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user._id }, UserService.jwtSecret, {
      expiresIn: UserService.jwtExpiresIn,
    });

    return { user, token };
  }

  /** Get current user */
  static async me(userId) {
    return UserService.User.findById(userId).select("-password");
  }

  /** Forgot password */
  static async forgotPassword(email) {
    const user = await UserService.User.findOne({ email });
    if (!user) throw new Error("No user with that email");

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1h
    await user.save();

    await UserService.emailProvider.sendMail(
      email,
      "Password Reset",
      `Use this token to reset your password: ${resetToken}`
    );

    return true;
  }

  /** Reset password */
  static async resetPassword(resetToken, newPassword) {
    const user = await UserService.User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error("Invalid or expired token");

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;
  }
}

module.exports = UserService;
