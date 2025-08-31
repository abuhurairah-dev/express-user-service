require("./setup");

const userData = {
  name: "Profile User",
  email: "profile@example.com",
  password: "password123",
};

describe("GET /api/users/me", () => {
  let token;

  beforeAll(async () => {
    // Register user
    await global.testRequest().post("/api/users/register").send(userData);

    // Login to get token
    const loginRes = await global.testRequest()
      .post("/api/users/login")
      .send({ email: userData.email, password: userData.password });

    token = loginRes.body.token;
  });

  it("should return the user profile when authenticated", async () => {
    const res = await global.testRequest()
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(userData.email);
    expect(res.body).toHaveProperty("createdAt");
    expect(res.body).toHaveProperty("updatedAt");
    expect(res.body).not.toHaveProperty("password"); // ensure sensitive fields excluded
  });

  it("should fail if no token is provided", async () => {
    const res = await global.testRequest().get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail with an invalid token", async () => {
    const res = await global.testRequest()
      .get("/api/users/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail with an expired token (simulate)", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: "fakeid" },
      process.env.JWT_SECRET || "testsecret",
      { expiresIn: "-10s" }
    );

    const res = await global.testRequest()
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if user does not exist in DB anymore", async () => {
    const jwt = require("jsonwebtoken");
    // Create a token for a non-existent user
    const fakeToken = jwt.sign(
      { id: "507f1f77bcf86cd799439011" }, // valid MongoDB ObjectId, but no user
      process.env.JWT_SECRET || "testsecret",
      { expiresIn: "1h" }
    );

    const res = await global.testRequest()
      .get("/api/users/me")
      .set("Authorization", `Bearer ${fakeToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});
