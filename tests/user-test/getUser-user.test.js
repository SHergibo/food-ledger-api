const request = require("supertest"),
      app = require("./../../config/app.config"),
      { api } = require('./../../config/environment.config'),
      { login } = require('./../login.helper'),
      { adminOneDataComplete } = require('./../test-data');

const { dbManagement } = require('../db-management-utils');
dbManagement();

describe("Get user", () => {
  it("1) Get user", async () => {
    const user = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    const accessToken = await login(adminOneDataComplete.email, adminOneDataComplete.password);

    const response = await request(app)
    .get(`/api/${api}/users/${user.body._id}`)
    .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id.toString()).toBe(user.body._id.toString());
  });
});