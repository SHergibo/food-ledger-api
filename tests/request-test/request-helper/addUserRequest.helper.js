const request = require("supertest");
const app = require("../../../config/app.config");
const { api } = require('../../../config/environment.config');
const Household = require('../../../api/models/household.model');
const User = require('../../../api/models/user.model');
const Notification = require('../../../api/models/notification.model');
const { login } = require('../../login.helper');

const createUsers = async (adminOneData, adminTwoData, objectClientSocket) => {
  const adminOne = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneData);

  const adminTwo = await request(app)
    .post(`/api/${api}/users`)
    .send(adminTwoData);

    objectClientSocket.clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: adminOne.body._id});
    objectClientSocket.clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${adminOne.body._id}/notificationReceived/0`});
    objectClientSocket.clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${adminOne.body._id}/notificationSended/0`});
    objectClientSocket.clientSocketAdminTwo.emit('enterSocketRoom', {socketRoomName: adminTwo.body._id});
    objectClientSocket.clientSocketAdminTwo.emit('enterSocketRoom', {socketRoomName: `${adminTwo.body._id}/notificationReceived/0`});
    objectClientSocket.clientSocketAdminTwo.emit('enterSocketRoom', {socketRoomName: `${adminTwo.body._id}/notificationSended/0`});

  return { adminOne, adminTwo };
};

const addUserRequest = async (objectData, accessToken) => {
  return await request(app)
  .post(`/api/${api}/requests/add-user-request`)
  .send(objectData)
  .set('Authorization', `Bearer ${accessToken}`);
};

module.exports.createErrorTest = async (adminOneData, adminTwoData, testName) => {
  const { adminOne, adminTwo } = await createUsers(adminOneData, adminTwoData);

  const accessTokenAdminOne = await login(adminOneData.email, adminOneData.password);

  const householdAdminOne = await Household.findById(adminOne.body.householdId);

  let objectData = {
    usercode : adminTwo.body.usercode,
    type: "householdToUser",
    householdCode: householdAdminOne.householdCode
  };

  if(testName === "badUserCode") objectData.usercode = ""
  if(testName === "badHouseholdCode") objectData.householdCode = "";

  if(testName === "householdIsWaiting"){
    await Household.findByIdAndUpdate(householdAdminOne._id, {isWaiting : true});
  }

  if(testName === "spamNotification"){
    let invitationRequestNotif = await new Notification({
      message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
      householdId: householdAdminOne._id,
      userId: adminTwo.body._id,
      type: "invitation-household-to-user",
      urlRequest: "add-user-respond"
    });
    await invitationRequestNotif.save();
  }

  if(testName === "otherHouseholdIsWaiting"){
    await Household.findByIdAndUpdate(adminTwo.body.householdId, {isWaiting : true});
  }

  if(testName === "sameHousehold"){
    await User.findByIdAndUpdate(adminTwo.body._id, {householdId : householdAdminOne._id});
  }

  const addUserResponse = await addUserRequest(objectData, accessTokenAdminOne);

  return {statusCode : addUserResponse.statusCode, error : JSON.parse(addUserResponse.error.text)}
};

module.exports.createAddUserRequestTestOne = async (adminOneData, adminTwoData, objectClientSocket) => {
  const { adminOne, adminTwo } = await createUsers(adminOneData, adminTwoData, objectClientSocket);

  const accessTokenAdminOne = await login(adminOneData.email, adminOneData.password);

  const householdAdminOne = await Household.findById(adminOne.body.householdId);

  let objectData = {
    usercode : adminTwo.body.usercode,
    type: "householdToUser",
    householdCode: householdAdminOne.householdCode
  };
  const addUser = await addUserRequest(objectData, accessTokenAdminOne);

  const notificationAddUser = await Notification.findOne({
    userId : adminTwo.body._id,
    householdId : householdAdminOne._id,
    type: "invitation-household-to-user"
  });

  return {addUser, admin: adminOne.body, user: adminTwo.body,  householdAdmin : householdAdminOne, notificationAddUser}
};

module.exports.createAddUserRequestTestTwo = async (adminOneData, adminTwoData) => {
  const { adminOne, adminTwo } = await createUsers(adminOneData, adminTwoData);
  
  const householdAdminTwo = await Household.findById(adminOne.body.householdId);
  let arrayMembers = householdAdminTwo.members;
  arrayMembers = [...arrayMembers, arrayMembers[1]];
  await Household.findByIdAndUpdate(adminTwo.body.householdId, {members : arrayMembers});

  const accessTokenAdminOne = await login(adminOneData.email, adminOneData.password);

  const householdAdminOne = await Household.findById(adminOne.body.householdId);

  let objectData = {
    usercode : adminTwo.body.usercode,
    type: "householdToUser",
    householdCode: householdAdminOne.householdCode
  };
  const addUser = await addUserRequest(objectData, accessTokenAdminOne);

  const notificationAddUser = await Notification.findOne({
    userId : adminTwo.body._id,
    householdId : householdAdminOne._id,
    type: "need-switch-admin"
  });

  return {addUser, adminTwo: adminTwo.body, householdAdminOne, notificationAddUser}
};

module.exports.createAddUserRequestTestThree = async (adminOneData, adminTwoData) => {
  const { adminOne, adminTwo } = await createUsers(adminOneData, adminTwoData);
  
  const accessTokenAdminTwo = await login(adminTwoData.email, adminTwoData.password);

  const householdAdminOne = await Household.findById(adminOne.body.householdId);

  let objectData = {
    usercode : adminTwo.body.usercode,
    type: "userToHousehold",
    householdCode: householdAdminOne.householdCode
  };
  const addUser = await addUserRequest(objectData, accessTokenAdminTwo);

  const notificationAddUser = await Notification.findOne({
    senderUserId : adminTwo.body._id,
    householdId : householdAdminOne._id,
    type: "invitation-user-to-household"
  });

  return {addUser, adminTwo: adminTwo.body, householdAdminOne, notificationAddUser}
};