require("./setup");

const userData = {
  name: "Profile User",
  email: "profile@example.com",
  password: "password123",
};

describe("GET /api/users/me", () => {
  let token;

  beforeAll(async () => {
    await global.testRequest().post("/api/users/register").send(userData);
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
  });
});
