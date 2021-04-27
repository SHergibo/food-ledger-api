const request = require("supertest"),
      app = require("./../config/app.config"),
      { api } = require('./../config/environment.config'),
      Household = require('./../api/models/household.model'),
      { login } = require('./login.helper'),
      { adminOneDataComplete, userDataMissing } = require('./test-data');

const { dbManagement } = require('./db-management-utils');
dbManagement();

describe("User test", () => {
  it("Create user with household", async () => {
    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    const household = await Household.findById(response.body.householdId);
    expect(response.statusCode).toBe(200);
    expect(response.body.householdId.toString()).toBe(household._id.toString());
    expect(household.userId.toString()).toBe(response.body._id.toString());
  });

  it("Create user with householdName/Code missing", async () => {
    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(userDataMissing);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.error.text).isBoom).toBe(true);
  });

  it("Get user", async () => {
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