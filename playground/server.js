require("dotenv").config();
const express = require("express");
const { UserService, userRoutes } = require("../index"); // import from your package

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
      },
    });

    // mount routes
    app.use("/api", userRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Playground running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start playground:", err);
  }
})();
