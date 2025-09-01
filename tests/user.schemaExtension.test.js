require("./setup");

const extendedUser = {
  name: "Extended User",
  email: "extuser@example.com",
  password: "password123",
  role: "manager",
  age: 30,
};

describe("User schema extensions", () => {
  it("should register user with extra fields", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send(extendedUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("role", "manager");
    expect(res.body.user).toHaveProperty("age", 30);
  });

  it("should login user and return extended fields", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: extendedUser.email, password: extendedUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("role", "manager");
    expect(res.body.user).toHaveProperty("age", 30);
    expect(res.body).toHaveProperty("token");
  });
});
