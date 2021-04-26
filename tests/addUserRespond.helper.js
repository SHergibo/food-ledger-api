const request = require("supertest"),
      app = require("../config/app.config"), 
      { api } = require('../config/environment.config'),
      { login } = require('./login.helper'),
      Household = require('../api/models/household.model'),
      User = require('../api/models/user.model'),
      Option = require('../api/models/option.model'),
      Notification = require('../api/models/notification.model'),
      cryptoRandomString = require('crypto-random-string');


const createUser = async (userData) => {
  let createUser = await new User({
    firstname: userData.firstname,
    lastname: userData.lastname,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    usercode: cryptoRandomString({length: 10, type: 'url-safe'}),
  });
  await createUser.save();

  let option = new Option({userId : user._id});
  await option.save();

  createUser = await User.findByIdAndUpdate(createUser._id, { optionId: option._id }, { override: true, upsert: true, new: true });
  return createUser;
};

const createHousehold = async (userId, householdName) => {
  let newHousehold = new Household({
    members: [
      {userData : userId, isFlagged: false}
    ],
    householdName: householdName,
    userId: userId,
    householdCode: cryptoRandomString({length: 10, type: 'url-safe'})
  });
  return await newHousehold.save();
};

const createHouseholdWithoutAdmin = async (userId, householdName) => {
  let newHousehold = new Household({
    members: [],
    householdName: householdName,
    userId: userId,
    householdCode: cryptoRandomString({length: 10, type: 'url-safe'})
  });
  return await newHousehold.save();
};

const updateUserHouseholdId = async (userId, householdId) => {
  return await User.findByIdAndUpdate(userId, { householdId: householdId }, { override: true, upsert: true, new: true });
};

const updateHouseholdMembers = async (householdId, membersArray, userId) => {
  return await Household.findByIdAndUpdate(householdId, { members: [...membersArray, {isFlagged : false, userData : userId}] }, { override: true, upsert: true, new: true });
};

const createAddUserRequestNotification = async (userData, householdId) => {
  let addUserRequestNotification = await new Notification({
    message: `L'utilisateur.trice ${userData.firstname} ${userData.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`,
    householdId: householdId,
    senderUserId: userData._id,
    type: "invitation-user-to-household",
    urlRequest: "add-user-respond"
  });
  return await addUserRequestNotification.save();
}

module.exports.createAddUserRespondTest = async () => {
  let adminOne = await createUser(adminOneDataComplete);
  const householdOne = await createHousehold(adminOne._id, adminOneDataComplete.householdName);
  adminOne = await updateUserHouseholdId(adminOne._id, householdOne._id);

  let adminTwo = await createUser(adminTwoDataComplete);
  let householdTwo = await createHousehold(adminTwo._id, adminTwoDataComplete.householdName);
  adminTwo = await updateUserHouseholdId(adminTwo._id, householdTwo._id);

  let userTwo = await createUser(userTwoDataComplete);
  userTwo = await updateUserHouseholdId(userTwo._id, householdTwo._id);
  householdTwo = await updateHouseholdMembers(householdTwo._id, householdTwo.members, userTwo._id);

  let userThree = await createUser(userThreeDataComplete);
  userThree = await updateUserHouseholdId(userThree._id, householdTwo._id);
  householdThree = await createHouseholdWithoutAdmin(userThree._id, userThreeDataComplete.householdName)
  householdTwo = await updateHouseholdMembers(householdTwo._id, householdTwo.members, userThree._id);

  return { adminOne, householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree};
};

module.exports.acceptAddUserRequest = async (adminTwo, householdOne) => {
  const addUserNotification = await createAddUserRequestNotification(adminTwo, householdOne._id);
  const accessTokenAdminOne = await login(adminOneDataComplete.email, adminOneDataComplete.password);

  const addUserRequestResponse = await request(app)
  .get(`/api/${api}/requests/add-user-respond/${addUserNotification._id}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenAdminOne}`);

  const notificationDelegateUser = await Notification.findOne({
    userId : adminTwo._id,
    householdId : householdOne._id,
    type: "need-switch-admin"
  });

  return { addUserRequestResponse, notificationDelegateUser };
};

const adminOneDataComplete = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'johndoe@test.com',
  password: '123456789',
  role : 'admin',
  householdName: "Familly-Doe"
};

const adminTwoDataComplete = {
  firstname: 'David',
  lastname: 'Doe',
  email: 'daviddoe@test.com',
  password: '123456789',
  role : 'admin',
  householdName: "Familly-DavidDoe"
};

const userTwoDataComplete = {
  firstname: 'Sabine',
  lastname: 'Doe',
  email: 'sabinedoe@test.com',
  password: '123456789',
  role : 'user',
};

const userThreeDataComplete = {
  firstname: 'Jules',
  lastname: 'Doe',
  email: 'julesjoe@test.com',
  password: '123456789',
  role : 'user',
  householdName: "Familly-JulesDoe"
};