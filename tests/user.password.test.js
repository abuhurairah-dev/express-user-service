require("./setup");
const { UserService } = require("../index");

const userData = {
  name: "Password User",
  email: "password@example.com",
  password: "password123",
};

describe("Password reset flow", () => {
  beforeAll(async () => {
    await global.testRequest().post("/api/users/register").send(userData);
  });

  it("should send reset email for valid user", async () => {
    const res = await global.testRequest()
      .post("/api/users/forgot-password")
      .send({ email: userData.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Reset email sent");
  });

  it("should reset password with valid token", async () => {
    // Request a reset
    await global.testRequest()
      .post("/api/users/forgot-password")
      .send({ email: userData.email });

    const user = await UserService.User.findOne({ email: userData.email });
    user.passwordResetExpires = Date.now() + 1000 * 60 * 10; // +10 mins
    await user.save();

    const token = user.passwordResetToken;

    // Use that token to reset password
    const res = await global.testRequest()
      .post("/api/users/reset-password")
      .send({ token, newPassword: "newpass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successful");
  });
});
