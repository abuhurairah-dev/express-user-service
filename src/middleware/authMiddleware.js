const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
    const decoded = jwt.verify(token, UserService.jwtSecret); // ✅ sync verify
    req.userId = decoded.id;

    const user = await UserService.me(decoded.id); // ✅ safe await
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token invalid or expired" });
  }
};

module.exports = authMiddleware;
