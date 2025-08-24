const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logger = require("../utils/logger");

class UserService {
  // Register new user
  static async registerUser({ name, email, password }) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });
      await newUser.save();

      logger.info(`✅ User registered: ${email}`);
      return { id: newUser._id, email: newUser.email, name: newUser.name };
    } catch (error) {
      logger.error(`❌ Error registering user: ${error.message}`);
      throw error;
    }
  }
}

module.exports = UserService;
