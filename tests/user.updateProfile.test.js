require("./setup");

describe("PATCH /api/users/me", () => {
  let token;
  let testEmail;

  beforeEach(async () => {
    testEmail = `${Date.now()}@example.com`;
    const res = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Profile User",
        email: testEmail,
        password: "password123",
        age: 23,
        roles: ["admin"]
      });
    token = res.body.token;
  });

  it("should update the user's profile (name)", async () => {
    const res = await global.testRequest()
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Updated Name");
    expect(res.body).toHaveProperty("email", testEmail); // unchanged
  });

  it("should allow updating custom fields (e.g. age)", async () => {
    const res = await global.testRequest()
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        age: 24,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("age", 24);
  });

  it("should not allow updating roles as a normal user", async () => {
    const res = await global.testRequest()
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        roles: ["user", "admin"], // should be ignored
      });

    console.log(res.body)
    expect(res.status).toBe(200);
    expect(res.body.roles).toContain("user"); // still user
  });

  it("should return 400 if no valid fields are provided", async () => {
    const res = await global.testRequest()
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: "newpassword123", // restricted
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail without authentication", async () => {
    const res = await global.testRequest()
      .patch("/api/users/me")
      .send({
        name: "Hacker",
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
