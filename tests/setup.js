const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const { UserService, userRoutes } = require("../index");
const express = require("express");

let mongod;
let app;

// ✅ Mock email provider
const fakeEmailProvider = {
  sendMail: jest.fn().mockResolvedValue(true),
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // ✅ Configure UserService once for tests
  UserService.configure({
    dbUri: uri,
    jwtSecret: "testsecret",
    emailProvider: fakeEmailProvider,
  });

  // ✅ Build app with user routes
  app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);

  // ✅ Expose testRequest globally
  global.testRequest = () => request(app);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});
