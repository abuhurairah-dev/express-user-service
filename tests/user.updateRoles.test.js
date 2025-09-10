require("./setup");

describe("PATCH /api/admin/users/:id/roles", () => {
  let adminToken;
  let adminId;
  let normalUserId;

  beforeEach(async () => {
    // create admin
    const adminEmail = `${Date.now()}-admin@example.com`;
    const adminRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Admin User",
        email: adminEmail,
        password: "password123",
        roles: ["admin"],
      });
    
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user._id;
  
    // create normal user
    const userEmail = `${Date.now()}-user@example.com`;
    const userRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Normal User",
        email: userEmail,
        password: "password123",
      });
    normalUserId = userRes.body.user._id;
  });

  it("should allow an admin to update a user's roles", async () => {
    const res = await global.testRequest()
      .patch(`/api/admin/users/${normalUserId}/roles`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roles: ["user", "manager"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("roles");
    expect(res.body.roles).toContain("manager");
  });

  it("should return 400 for invalid roles", async () => {
    const res = await global.testRequest()
      .patch(`/api/admin/users/${normalUserId}/roles`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roles: ["superman"],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should not allow a non-admin user to update roles", async () => {
    // login as normal user
    const loginRes = await global.testRequest()
      .post("/api/auth/login")
      .send({
        email: `${Date.now()}-user2@example.com`,
        password: "password123",
      })
      .catch(() => null);

    // OR if your register returns token, reuse that
    const userEmail = `${Date.now()}-user2@example.com`;
    const userRes = await global.testRequest()
      .post("/api/users/register")
      .send({
        name: "Other User",
        email: userEmail,
        password: "password123",
      });
    const userToken = userRes.body.token;

    const res = await global.testRequest()
      .patch(`/api/admin/users/${normalUserId}/roles`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        roles: ["manager"],
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 if user is not found", async () => {
    const res = await global.testRequest()
      .patch(`/api/admin/users/64f9c21e9a1b2c3d4e5f6789/roles`) // fake id
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roles: ["user"],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "User not found");
  });
});
