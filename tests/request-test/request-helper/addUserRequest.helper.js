const request = require("supertest");
const app = require("../../../config/app.config");
const { api } = require('../../../config/environment.config');
const Household = require('../../../api/models/household.model');
const User = require('../../../api/models/user.model');
const Notification = require('../../../api/models/notification.model');
const { login } = require('../../login.helper');

module.exports.createErrorTest = async (adminData, userData, testName) => {
  const admin = await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

  const user = await request(app)
    .post(`/api/${api}/users`)
    .send(userData);

  const accessTokenAdmin = await login(adminData.email, adminData.password);

  const householdAdmin = await Household.findById(admin.body.householdId);

  let objectData = {
    usercode : user.body.usercode,
    type: "householdToUser",
    householdCode: householdAdmin.householdCode
  };

  if(testName === "badUserCode") objectData.usercode = ""
  if(testName === "badHouseholdCode") objectData.householdCode = "";

  if(testName === "householdIsWaiting"){
    await Household.findByIdAndUpdate(householdAdmin._id, {isWaiting : true}, { override: true, upsert: true, new: true });
  }

  if(testName === "spamNotification"){
    let invitationRequestNotif = await new Notification({
      message: `L'administrateur.trice de la famille ${householdAdmin.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
      householdId: householdAdmin._id,
      userId: user.body._id,
      type: "invitation-household-to-user",
      urlRequest: "add-user-respond"
    });
    await invitationRequestNotif.save();
  }

  if(testName === "otherHouseholdIsWaiting"){
    await Household.findByIdAndUpdate(user.body.householdId, {isWaiting : true}, { override: true, upsert: true, new: true });
  }

  if(testName === "sameHousehold"){
    await User.findByIdAndUpdate(user.body._id, {householdId : householdAdmin._id}, { override: true, upsert: true, new: true });
  }

  const addUserResponse = await request(app)
    .post(`/api/${api}/requests/add-user-request`)
    .send(objectData)
    .set('Authorization', `Bearer ${accessTokenAdmin}`);

  return {statusCode : addUserResponse.statusCode, error : JSON.parse(addUserResponse.error.text)}
};

module.exports.createAddUserRequestTestOne = async (adminData, userData) => {
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

  return {addUser, admin: admin.body, user: user.body,  householdAdmin, notificationAddUser}
};

module.exports.createAddUserRequestTestTwo = async (adminOneData, adminTwoData) => {
  const adminOne = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneData);

  const adminTwo = await request(app)
    .post(`/api/${api}/users`)
    .send(adminTwoData);

  const householdAdminTwo = await Household.findById(adminOne.body.householdId);
  let arrayMembers = householdAdminTwo.members;
  arrayMembers = [...arrayMembers, arrayMembers[1]];
  await Household.findByIdAndUpdate(adminTwo.body.householdId, {members : arrayMembers}, { override: true, upsert: true, new: true });

  const accessTokenAdminOne = await login(adminOneData.email, adminOneData.password);

  const householdAdminOne = await Household.findById(adminOne.body.householdId);

  const addUser = await request(app)
    .post(`/api/${api}/requests/add-user-request`)
    .send({
      usercode : adminTwo.body.usercode,
      type: "householdToUser",
      householdCode: householdAdminOne.householdCode
    })
    .set('Authorization', `Bearer ${accessTokenAdminOne}`);

  const notificationAddUser = await Notification.findOne({
    userId : adminTwo.body._id,
    householdId : householdAdminOne._id,
    type: "need-switch-admin"
  });

  return {addUser, adminTwo: adminTwo.body, householdAdminOne, notificationAddUser}
};