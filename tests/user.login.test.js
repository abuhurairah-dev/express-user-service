require("./setup");

const userData = {
  name: "Login User",
  email: "login@example.com",
  password: "password123",
};

describe("POST /api/users/login", () => {
  beforeAll(async () => {
    await global.testRequest().post("/api/users/register").send(userData);
  });

  it("should login successfully with correct credentials", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: userData.email, password: userData.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user).not.toHaveProperty("password"); // sensitive info check
  });

  it("should fail when password is incorrect", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: userData.email, password: "wrongpass" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when email does not exist", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: "notfound@example.com", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when email is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ password: userData.password });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when password is missing", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: userData.email });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when email format is invalid", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: "invalid-email", password: userData.password });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
