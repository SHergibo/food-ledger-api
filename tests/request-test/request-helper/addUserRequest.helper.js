const request = require("supertest");
const app = require("../../../config/app.config");
const { api } = require('../../../config/environment.config');
const Household = require('../../../api/models/household.model');
const Notification = require('../../../api/models/notification.model');
const { login } = require('../../login.helper');

module.exports.createAddUserRequestTest = async (adminData, userData) => {
  const admin = await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

  const user = await request(app)
    .post(`/api/${api}/users`)
    .send(userData);

  const accessTokenAdmin = await login(adminData.email, adminData.password);

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