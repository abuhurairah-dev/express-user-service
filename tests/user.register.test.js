const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const db = require("./setup");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("POST /api/users/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("email", "john@example.com");

    const user = await User.findOne({ email: "john@example.com" });
    expect(user).not.toBeNull();
    expect(user.password).not.toBe("Password123"); 
  });

  it("should fail when email is missing", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ name: "John Doe", password: "Password123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email/i);
  });

  it("should fail when email is invalid", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "John Doe",
        email: "invalid-email",
        password: "Password123",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/valid email/i);
  });

  it("should fail when password is missing", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/password/i);
  });

  it("should fail when password is too short", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "123",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/password/i);
  });

  it("should fail when email already exists", async () => {
    await request(app)
      .post("/api/users/register")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
      });

    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "Jane Doe",
        email: "john@example.com",
        password: "Password123",
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });
});
