require("dotenv").config();
const express = require("express");
const { UserService, userRoutes, adminRoutes } = require("../index");

const app = express();
app.use(express.json());

(async () => {
  try {
    await UserService.configure({
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
      dbUri: process.env.MONGO_URI,
      emailProvider: {
        sendMail: async (to, subject, text) => {
          console.log(`📧 [DEV-EMAIL] to=${to}, subject=${subject}, text=${text}`);
        },
      },
      userSchemaExtension: {
        // Note: Add cutome fields for registration other than email, name, and password
        username: { type: String, minlength: [2, "Name must be at least 2 characters long"] },
        age: { type: Number, min: 0 },
        roles: {
          type: [String],
          enum: ["manager", "trainer"], // Make roles customizable
          default: ["user"]
        },
      },
      collectionName: "Member",  // consumer chooses table/collection
    });

    // mount routes
    app.use("/api", userRoutes);
    app.use("/api/admin", adminRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Playground running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start playground:", err);
  }
})();
