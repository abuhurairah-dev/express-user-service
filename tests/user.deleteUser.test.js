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
        roles: ["admin"], // assuming you support roles
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

    // depending on your logic → 400 or 403
    expect(selfDeleteRes.status).toBe(400);
    expect(selfDeleteRes.body).toHaveProperty("error");
  });
});
