const bcrypt = require("bcryptjs");
const User = require("../models/User");

class UserService {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    return user.save();
  }
}

module.exports = UserService;
