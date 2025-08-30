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
  });

  it("should fail when password is incorrect", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: userData.email, password: "wrongpass" });

    expect(res.status).toBe(400);
  });
});
