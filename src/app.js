const express = require("express");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);

app.use(errorHandler);

// Comment out for local testing
// const UserService = require("../src/services/userService");

// // For testing (console logging instead of sending real email)
// UserService.configure({
//   sendEmail: async ({ to, subject, html }) => {
//     console.log("📧 FAKE EMAIL:", { to, subject, html });
//   },
// });

module.exports = app;
