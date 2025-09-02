const UserService = require("../services/userService");

function roleMiddleware(roles = []) {
  return async (req, res, next) => {
    try {
      const user = await UserService.me(req.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!UserService.hasRole(user, roles)) {
        return res.status(403).json({ error: "Forbidden: insufficient role" });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: "Authorization error" });
    }
  };
}

module.exports = roleMiddleware;
