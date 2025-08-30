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
  });
});
