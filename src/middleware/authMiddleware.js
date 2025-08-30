const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  jwt.verify(token, UserService.jwtSecret, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.userId = decoded.id;
    next();
  });
};

module.exports = authMiddleware;
