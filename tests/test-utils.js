const request = require("supertest");
const app = require("./../config/app.config");
const db = require('./db');
const { port, api } = require('./../config/environment.config');
const Household = require('../api/models/household.model');
const Notification = require('../api/models/notification.model');

module.exports.dbManagement = () => {
  beforeAll(async (done) => {
    await db.connect();
    app.listen(port, ()=> done());
  });

  afterEach(async () => await db.clearDatabase());

  afterAll(async (done) => {
    await db.closeDatabase();
    app.listening ? app.close(() => done()) : done();
  });
};

const logIn = async (email, password) => {
  const login = await request(app)
  .post(`/api/${api}/auth/login`)
  .send({
    email : email,
    password: password
  });

  return login.body.token.accessToken;
};

module.exports.login = async (email, password) => {
  return await logIn(email, password);
};

module.exports.createAddUserRequestTest = async (adminData, userData) => {
  const admin = await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

  const user = await request(app)
    .post(`/api/${api}/users`)
    .send(userData);

  const accessTokenAdmin = await logIn(adminData.email, adminData.password);

  const householdAdmin = await Household.findById(admin.body.householdId);

  const addUser = await request(app)
    .post(`/api/${api}/requests/add-user-request`)
    .send({
      usercode : user.body.usercode,
      type: "householdToUser",
      householdCode: householdAdmin.householdCode
    })
    .set('Authorization', `Bearer ${accessTokenAdmin}`);

  const notificationAddUser = await Notification.findOne({
    userId : user.body._id,
    householdId : householdAdmin._id,
    type: "invitation-household-to-user"
  });

  return {admin: admin.body, user: user.body, addUser, householdAdmin, notificationAddUser}
};