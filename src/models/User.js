const mongoose = require("mongoose");

let UserModel;

/** Base schema with default fields */
const baseFields = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
};

/** Factory for creating the User model with schema extension */
function createUserModel(extensionFields = {}) {
  if (UserModel) return UserModel; // avoid redefining

  const schema = new mongoose.Schema({
    ...baseFields,
    ...extensionFields,
  });

  UserModel = mongoose.models.User || mongoose.model("User", schema);
  return UserModel;
}

module.exports = { createUserModel };
