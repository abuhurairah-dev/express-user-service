require("./setup");

describe("POST /api/users/register", () => {
  it("should register a new user successfully", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", "test@example.com");
  });

  it("should not allow registration with an existing email", async () => {
    // First register
    await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
      });

    // Second registration with same email
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Duplicate User",
        email: "existing@example.com",
        password: "password123",
      });

    expect(res.status).toBe(400); // assuming you send 400 for bad requests
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if name is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        email: "noname@example.com",
        password: "password123",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if email is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "No Email",
        password: "password123",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if password is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "No Password",
        email: "nopass@example.com",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if password is too short", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Short Password",
        email: "shortpass@example.com",
        password: "123",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail if email is invalid", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Invalid Email",
        email: "not-an-email",
        password: "password123",
      });
    
    console.log(res.body)
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
