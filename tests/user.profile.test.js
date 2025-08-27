const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const db = require("./setup");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("GET /api/users/me", () => {
  it("should return the user profile when authenticated", async () => {
    const userData = { name: "John Doe", email: "john@example.com", password: "Password123" };

    await request(app).post("/api/users/register").send(userData);

    const loginRes = await request(app).post("/api/users/login").send({
      email: userData.email,
      password: userData.password,
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("email", userData.email);
  });

  it("should fail when no token is provided", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
