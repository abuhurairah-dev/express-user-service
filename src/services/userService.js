const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createUserModel } = require("../models/User");
const logger = require("../utils/logger");

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
    try {
      if (!jwtSecret) throw new Error("JWT secret is required");

      if (!emailProvider || typeof emailProvider.sendMail !== "function") {
        throw new Error(
          "Email provider with sendMail(to, subject, text) is required"
        );
      }

      if (dbConnection) {
        UserService.db = dbConnection;
        logger.info("✅ Using consumer-provided DB connection");
      } else if (dbUri) {
        UserService.db = await mongoose.connect(dbUri);
        logger.info("✅ Connected to MongoDB via URI");
      } else {
        throw new Error("Either dbUri or dbConnection is required");
      }

      UserService.jwtSecret = jwtSecret;
      UserService.jwtExpiresIn = jwtExpiresIn;
      UserService.emailProvider = emailProvider;
      UserService.User = createUserModel(userSchemaExtension);

      logger.info("✅ UserService configured successfully");
    } catch (err) {
      logger.error("❌ Failed to configure UserService", err);
      throw err;
    }
  }

  /** Helper: validate email format */
  static isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
  }

  /** Helper: validate password strength */
  static isValidPassword(password) {
    return password && password.length >= 8;
  }

  /** Register a new user */
  static async register({ name, email, password, ...rest }) {
    if (!name || name.length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }
    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!this.isValidPassword(password)) {
      throw new Error("Password must be at least 8 characters long");
    }

    const existing = await UserService.User.findOne({ email });
    if (existing) {
      logger.warn(`Attempt to register existing user: ${email}`);
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserService.User({
      name,
      email,
      password: hashedPassword,
      ...rest,
    });

    try {
      await user.save();
    } catch (err) {
      logger.error("Error saving user:", err);
      throw new Error("Failed to register user");
    }

    logger.info(`New user registered: ${email}`);

    return await UserService.User.findById(user._id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );
  }

  /** Login user and return JWT token */
  static async login({ email, password }) {
    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!this.isValidPassword(password)) {
      throw new Error("Invalid password length");
    }

    const user = await UserService.User.findOne({ email });
    if (!user) {
      logger.warn(`Login failed for non-existent user: ${email}`);
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, UserService.jwtSecret, {
      expiresIn: UserService.jwtExpiresIn,
    });

    logger.info(`User logged in: ${email}`);

    const safeUser = await UserService.User.findById(user._id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    return { user: safeUser, token };
  }

  /** Get current user details */
  static async me(userId) {
    return UserService.User.findById(userId).select(
      "-password -passwordResetToken -passwordResetExpires"
    );
  }

  /** Forgot password: generate token and send email */
  static async forgotPassword(email) {
    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const user = await UserService.User.findOne({ email });
    if (!user) {
      logger.warn(`Forgot password requested for non-existent email: ${email}`);
      throw new Error("No user with that email");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await UserService.emailProvider.sendMail(
      email,
      "Password Reset",
      `Use this token to reset your password: ${resetToken}`
    );

    logger.info(`Password reset token sent to: ${email}`);
    return true;
  }

  /** Reset password */
  static async resetPassword(resetToken, newPassword) {
    if (!this.isValidPassword(newPassword)) {
      throw new Error("Password must be at least 8 characters long");
    }

    const user = await UserService.User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      logger.warn(`Invalid or expired password reset token used`);
      throw new Error("Invalid or expired token");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password successfully reset for user: ${user.email}`);
    return true;
  }
}

module.exports = UserService;
