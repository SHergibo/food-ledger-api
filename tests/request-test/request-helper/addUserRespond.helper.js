const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../login.helper'),
      Household = require('../../../api/models/household.model'),
      User = require('../../../api/models/user.model'),
      Notification = require('../../../api/models/notification.model'),
      cryptoRandomString = require('crypto-random-string'),
      {adminOneDataComplete, adminTwoDataComplete, userTwoDataComplete, userThreeDataComplete} = require('../../test-data'),
      {createUser, createHousehold, updateUserHouseholdId, updateHouseholdMembers} = require('./createUserManagement.helper'),
      Client = require("socket.io-client");

const createHouseholdWithoutAdmin = async (userId, householdName) => {
  let newHousehold = new Household({
    members: [],
    householdName: householdName,
    userId: userId,
    householdCode: cryptoRandomString({length: 10, type: 'url-safe'})
  });
  return await newHousehold.save();
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

module.exports.createAddUserRespondTest = async (withSocket) => {
  let clientSocketAdminOne, clientSocketAdminTwo, clientSocketUserTwo, clientSocketUserThree;
  if(withSocket){
    clientSocketAdminOne = Client(`http://localhost:8003`);
    clientSocketAdminTwo = Client(`http://localhost:8003`);
    clientSocketUserTwo = Client(`http://localhost:8003`);
    clientSocketUserThree = Client(`http://localhost:8003`);
  }

  let adminOne = await createUser({userData : adminOneDataComplete, clientSocket: clientSocketAdminOne});
  const householdOne = await createHousehold(adminOne._id, adminOneDataComplete.householdName);
  adminOne = await updateUserHouseholdId(adminOne._id, householdOne._id);

  let adminTwo = await createUser({userData : adminTwoDataComplete, clientSocket: clientSocketAdminTwo});
  let householdTwo = await createHousehold(adminTwo._id, adminTwoDataComplete.householdName);
  adminTwo = await updateUserHouseholdId(adminTwo._id, householdTwo._id);

  let userTwo = await createUser({userData : userTwoDataComplete, clientSocket: clientSocketUserTwo});
  userTwo = await updateUserHouseholdId(userTwo._id, householdTwo._id);
  householdTwo = await updateHouseholdMembers(householdTwo._id, householdTwo.members, userTwo._id);

  let userThree = await createUser({userData : userThreeDataComplete, clientSocket: clientSocketUserThree});
  userThree = await updateUserHouseholdId(userThree._id, householdTwo._id);
  householdThree = await createHouseholdWithoutAdmin(userThree._id, userThreeDataComplete.householdName)
  householdTwo = await updateHouseholdMembers(householdTwo._id, householdTwo.members, userThree._id);

  const objectClientSocket = {
    clientSocketAdminOne,
    clientSocketAdminTwo,
    clientSocketUserTwo,
    clientSocketUserThree
  }

  return { adminOne, householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree, objectClientSocket };
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
    message: "L'administrateur.trice de la famille {householdName} a accepté.e votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droits d'administration à un.e autre membre de votre famille.",
    userId : adminTwo._id,
    householdId : householdOne._id,
    type: "need-switch-admin",
    urlRequest: "add-user-respond"
  });

  return { addUserNotification, addUserRequestResponse, notificationDelegateUser };
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

module.exports.delegateWithoutOtherMember = async (adminTwo, householdOne, householdTwo, notificationId, userTwo, userThree, householdThree) => {
  const accessTokenAdminTwo = await login(adminTwoDataComplete.email, adminTwoDataComplete.password);

  const delegateResponse = await request(app)
  .get(`/api/${api}/requests/add-user-respond/${notificationId}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenAdminTwo}`);

  const notificationDeleted = await Notification.findById(notificationId);

  const householdOneAfterSwitch = await Household.findById(householdOne._id);
  const isAdminTwoInHouseholdOne = householdOneAfterSwitch.members.find(member => member.userData.toString() === adminTwo._id.toString());
  const householdTwoAfterSwitch = await Household.findById(householdTwo._id);
  const adminTwoAfterSwitch = await User.findById(adminTwo._id);
  const userTwoAfterSwitch = await User.findById(userTwo._id);
  const userThreeAfterSwitch = await User.findById(userThree._id);
  const householdThreeAfterSwitch = await Household.findById(householdThree._id);
  const isUserThreeInHouseholdOne = householdThreeAfterSwitch.members.find(member => member.userData.toString() === userThree._id.toString());

  return { 
    delegateResponse, 
    notificationDeleted, 
    isAdminTwoInHouseholdOne, 
    adminTwoAfterSwitch,
    householdTwoAfterSwitch, 
    userTwoAfterSwitch,
    userThreeAfterSwitch,
    isUserThreeInHouseholdOne
  };
};

module.exports.testTranformInviteNotif = async (adminOne, householdOne, userTwo, householdTwo) => {
  let invitationRequestNotif = await new Notification({
    message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
    householdId: householdTwo._id,
    userId: adminOne._id,
    type: "invitation-household-to-user",
    urlRequest: "add-user-respond"
  });
  await invitationRequestNotif.save();

  const addUserNotification = await createAddUserRequestNotification(userTwo, householdOne._id);

  const accessTokenAdminOne = await login(adminOneDataComplete.email, adminOneDataComplete.password);

  const delegateResponse = await request(app)
  .get(`/api/${api}/requests/add-user-respond/${addUserNotification._id}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenAdminOne}`);

  const notificationDeleted = await Notification.findById(addUserNotification._id);

  const inviteNotifDeleted = await Notification.findById(invitationRequestNotif._id);

  const tranformedNotification = await Notification.findOne({
    message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`,
    householdId: householdTwo._id,
    userId: adminOne._id,
    type: "need-switch-admin",
    urlRequest: "add-user-respond",
  });

  return { 
    delegateResponse,
    notificationDeleted, 
    inviteNotifDeleted, 
    tranformedNotification, 
  };
};