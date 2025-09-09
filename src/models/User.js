const mongoose = require("mongoose");

let UserModel;
const defaultRoles = ["user", "admin"];

/** Base schema with default fields + validations */
const baseFields = {
  name: { 
    type: String, 
    required: true, 
    minlength: [2, "Name must be at least 2 characters long"], 
    maxlength: [50, "Name must be at most 50 characters long"] 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, "Password must be at least 8 characters long"]
  },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  roles: {
    type: [String],
    enum: defaultRoles,
    default: ["user"]
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
};

/** Factory for creating the User model with schema extension */
function createUserModel(extensionFields = {}, collectionName = "User") {
  if (UserModel) return UserModel; // avoid redefining

  const consumerRoles = (extensionFields.roles?.enum || [])
    .filter(r => !defaultRoles.includes(r)); // avoid overriding core roles
  const mergedRoles = [...defaultRoles, ...consumerRoles];

  const schemaDef = {
    ...baseFields,
    ...extensionFields,
    roles: {
      type: [String],
      enum: mergedRoles,
      default: ["user"],
    },
  };

  const schema = new mongoose.Schema(schemaDef, { timestamps: true });

  UserModel = mongoose.models[collectionName] || mongoose.model(collectionName, schema);
  return UserModel;
}

module.exports = { createUserModel };
