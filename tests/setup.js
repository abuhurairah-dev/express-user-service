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

const schemaExtension = {
  role: { type: String, default: "user" },
  age: { type: Number, min: 0 },
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // ✅ Configure UserService once for tests
  UserService.configure({
    dbUri: uri,
    jwtSecret: "testsecret",
    emailProvider: fakeEmailProvider,
    userSchemaExtension: schemaExtension,
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
