const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const db = require("./setup");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("POST /api/users/login", () => {
  const userData = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123",
  };

  beforeEach(async () => {
    // Register a test user before each login test
    await request(app).post("/api/users/register").send(userData);
  });

  it("should login successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: userData.email, password: userData.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
    expect(res.body.data.email).toBe(userData.email);
  });

  it("should fail when password is incorrect", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: userData.email, password: "WrongPassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("should fail when email does not exist", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "nouser@example.com", password: "Password123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("should fail when email is missing", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ password: userData.password });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email and password are required/i);
  });

  it("should fail when password is missing", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: userData.email });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email and password are required/i);
  });
});
