const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../login.helper'),
      Household = require('../../../api/models/household.model'),
      User = require('../../../api/models/user.model'),
      Option = require('../../../api/models/option.model'),
      Notification = require('../../../api/models/notification.model'),
      cryptoRandomString = require('crypto-random-string'),
      {adminOneDataComplete, adminTwoDataComplete, userTwoDataComplete, userThreeDataComplete} = require('../../test-data');

const createUser = async (userData) => {
  let createdUser = await new User({
    firstname: userData.firstname,
    lastname: userData.lastname,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    usercode: cryptoRandomString({length: 10, type: 'url-safe'}),
  });
  await createdUser.save();

  let option = new Option({userId : createdUser._id});
  await option.save();

  createdUser = await User.findByIdAndUpdate(createdUser._id, { optionId: option._id }, { override: true, upsert: true, new: true });
  return createdUser;
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

module.exports.createAddUserRespondTestOneUser = async () => {
  let adminOne = await createUser(adminOneDataComplete);
  const householdOne = await createHousehold(adminOne._id, adminOneDataComplete.householdName);
  adminOne = await updateUserHouseholdId(adminOne._id, householdOne._id);

  let adminTwo = await createUser(adminTwoDataComplete);
  let householdTwo = await createHousehold(adminTwo._id, adminTwoDataComplete.householdName);
  adminTwo = await updateUserHouseholdId(adminTwo._id, householdTwo._id);

  let userTwo = await createUser(userTwoDataComplete);
  userTwo = await updateUserHouseholdId(userTwo._id, householdTwo._id);
  householdTwo = await updateHouseholdMembers(householdTwo._id, householdTwo.members, userTwo._id);

  return { adminOne, householdOne, adminTwo, householdTwo, userTwo };
};

module.exports.acceptAddUserRequest = async (adminTwo, householdOne) => {
  const addUserNotification = await createAddUserRequestNotification(adminTwo, householdOne._id);
  const accessTokenAdminOne = await login(adminOneDataComplete.email, adminOneDataComplete.password);

  const addUserRequestResponse = await request(app)
  .get(`/api/${api}/requests/add-user-respond/${addUserNotification._id}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenAdminOne}`);

  const notificationDelegateUser = await Notification.findOne({
    message: "L'administrateur.trice a accepté.e votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droits d'administration à un.e autre membre de votre famille.",
    userId : adminTwo._id,
    householdId : householdOne._id,
    type: "need-switch-admin",
    urlRequest: "add-user-respond"
  });

  return { addUserRequestResponse, notificationDelegateUser };
};

module.exports.delegateWithOtherMember = async (adminTwo, householdOne, householdTwo, notificationId, otherMember) => {
  const accessTokenAdminTwo = await login(adminTwoDataComplete.email, adminTwoDataComplete.password);

  const delegateResponse = await request(app)
  .get(`/api/${api}/requests/add-user-respond/${notificationId}?acceptedRequest=yes&otherMember=${otherMember}`)
  .set('Authorization', `Bearer ${accessTokenAdminTwo}`);

  const notificationRequestDelegateAdmin = await Notification.findOne({
    userId : otherMember,
    householdId : adminTwo.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const householdOneAfterSwitch = await Household.findById(householdOne._id);
  const isUserInHouseholdOne = householdOneAfterSwitch.members.find(member => member.userData.toString() === adminTwo._id.toString());
  const householdTwoAfterSwitch = await Household.findById(householdTwo._id);
  const isUserInHouseholdTwo = householdTwoAfterSwitch.members.find(member => member.userData.toString() === adminTwo._id.toString());

  const adminTwoAfterSwitch = await User.findById(adminTwo._id);

  return { delegateResponse, notificationRequestDelegateAdmin, householdOneAfterSwitch, householdTwoAfterSwitch, isUserInHouseholdOne, isUserInHouseholdTwo, adminTwoAfterSwitch };
};