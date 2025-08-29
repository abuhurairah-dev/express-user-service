const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const db = require("./setup");
const crypto = require("crypto");

// Mock email sender before tests
beforeAll(async () => {
  await db.connect();
  // inject mock email sender into UserService
  const UserService = require("../src/services/userService");
  UserService.configure({
    sendEmail: jest.fn().mockResolvedValue(true),
  });
});
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("Password reset flow", () => {
  const userData = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "Password123",
  };

  beforeEach(async () => {
    await request(app).post("/api/users/register").send(userData);
  });

  describe("POST /api/users/forgot-password", () => {
    it("should send reset email for valid user", async () => {
      const res = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: userData.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/reset email sent/i);

      // ensure token was stored in DB
      const user = await User.findOne({ email: userData.email });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });

    it("should return 404 if email not found", async () => {
      const res = await request(app)
        .post("/api/users/forgot-password")
        .send({ email: "nouser@example.com" });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no user with that email/i);
    });

    it("should return 400 if email is missing", async () => {
      const res = await request(app).post("/api/users/forgot-password").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email is required/i);
    });
  });

  describe("POST /api/users/reset-password/:token", () => {
    it("should reset password with valid token", async () => {
      // Request reset to generate token
      await request(app).post("/api/users/forgot-password").send({ email: userData.email });
      const user = await User.findOne({ email: userData.email });

      // token stored hashed → need original token for request
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();

      const newPass = "NewPass123";
      const res = await request(app)
        .post(`/api/users/reset-password/${rawToken}`)
        .send({ newPassword: newPass });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/password has been reset/i);

      // verify login with new password works
      const loginRes = await request(app)
        .post("/api/users/login")
        .send({ email: userData.email, password: newPass });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it("should fail if token is invalid", async () => {
      const res = await request(app)
        .post("/api/users/reset-password/invalidtoken")
        .send({ newPassword: "AnotherPass123" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired reset token/i);
    });

    it("should fail if newPassword is missing", async () => {
      const res = await request(app)
        .post("/api/users/reset-password/sometoken")
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token and new password are required/i);
    });
  });
});
