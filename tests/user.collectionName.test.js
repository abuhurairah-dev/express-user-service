require("./setup");

const customUser = {
  name: "Custom Table User",
  email: "custom@example.com",
  password: "password123",
};

describe("User model with custom table name", () => {
  it("should register a user into the custom table", async () => {
    const res = await global.testRequest()
      .post("/api/users/register")
      .send(customUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("email", "custom@example.com");
  });

  it("should login from the custom table and return token", async () => {
    const res = await global.testRequest()
      .post("/api/users/login")
      .send({ email: customUser.email, password: customUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email", "custom@example.com");
    expect(res.body).toHaveProperty("token");
  });
});
