require("./setup");

describe("DELETE /api/admin/users/:id", () => {
  let adminToken;
  let userId;

  beforeAll(async () => {
    // Create admin
    const adminRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        roles: ["admin"],
      });
    adminToken = adminRes.body.token;

    // Create normal user to be deleted
    const userRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Delete Me",
        email: "deleteme@example.com",
        password: "password123",
        roles: ["user"],
      });
    userId = userRes.body.user._id;
  });

  it("should soft delete a user successfully (admin deletes another user)", async () => {
    const res = await global.testRequest()
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should not allow a user to delete themselves", async () => {
    const selfDeleteRes = await global.testRequest()
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(selfDeleteRes.status).toBe(400);
    expect(selfDeleteRes.body).toHaveProperty("error");
  });

  it("should not allow non-admin user to delete another user", async () => {
    const userRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Normal User",
        email: "normal@example.com",
        password: "password123",
        roles: ["user"],
      });
    const userToken = userRes.body.token;

    const res = await global.testRequest()
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 if user does not exist", async () => {
    const nonExistingId = "64b91f3f2f8b9e0012345678"; // random ObjectId
    const res = await global.testRequest()
      .delete(`/api/admin/users/${nonExistingId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 if user is already deleted", async () => {
    const res = await global.testRequest()
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid user ID format", async () => {
    const res = await global.testRequest()
      .delete(`/api/admin/users/invalid-id`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 401 if no token is provided", async () => {
    const res = await global.testRequest().delete(`/api/admin/users/${userId}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 403 if token is invalid", async () => {
    const res = await global.testRequest()
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", "Bearer invalidtoken123");

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});
