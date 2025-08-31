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

  it("should fail to send reset email for non-existing user", async () => {
    const res = await global.testRequest()
      .post("/api/users/forgot-password")
      .send({ email: "notfound@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when email is missing in forgot-password", async () => {
    const res = await global.testRequest()
      .post("/api/users/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
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

  it("should fail to reset password with invalid token", async () => {
    const res = await global.testRequest()
      .post("/api/users/reset-password")
      .send({ token: "invalidtoken", newPassword: "anotherpass123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail to reset password if token is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/reset-password")
      .send({ newPassword: "newpass123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail to reset password if new password is missing", async () => {
    const user = await UserService.User.findOne({ email: userData.email });

    // Ensure user has a valid reset token
    await global.testRequest()
      .post("/api/users/forgot-password")
      .send({ email: userData.email });

    const updatedUser = await UserService.User.findOne({ email: userData.email });
    updatedUser.passwordResetExpires = Date.now() + 1000 * 60 * 10;
    await updatedUser.save();

    const token = updatedUser.passwordResetToken;

    const res = await global.testRequest()
      .post("/api/users/reset-password")
      .send({ token });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail to reset password with expired token", async () => {
    // Request a reset again
    await global.testRequest()
      .post("/api/users/forgot-password")
      .send({ email: userData.email });

    const user = await UserService.User.findOne({ email: userData.email });
    user.passwordResetExpires = Date.now() - 1000 * 60; // expired 1 min ago
    await user.save();

    const token = user.passwordResetToken;

    const res = await global.testRequest()
      .post("/api/users/reset-password")
      .send({ token, newPassword: "expiredpass123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
