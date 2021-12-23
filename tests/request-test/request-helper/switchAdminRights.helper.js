const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../global-helper/login.helper'),
      Notification = require('../../../api/models/notification.model'),
      {adminOneDataComplete, userTwoDataComplete} = require('../../test-data'),
      {createUser, createHousehold, updateUserHouseholdId, updateHouseholdMembers} = require('../../global-helper/createUserManagement.helper'),
      Client = require("socket.io-client"),
      { connectSocketClient } = require('../../socket-io-management-utils');

const switchAdminRightsRequest = async (objectData, accessToken) => {
  return await request(app)
  .post(`/api/${api}/requests/switch-admin-rights`)
  .send(objectData)
  .set('Authorization', `Bearer ${accessToken}`);
};

const createUsers = async (withSocket) => {
  let clientSocketAdminOne, clientSocketUserTwo;
  if(withSocket){
    clientSocketAdminOne = Client(`http://localhost:8003`);
    clientSocketUserTwo = Client(`http://localhost:8003`);
    connectSocketClient({clientSocketAdminOne, clientSocketUserTwo});
  }

  let adminOne = await createUser({userData : adminOneDataComplete, clientSocket: clientSocketAdminOne});
  const householdOne = await createHousehold(adminOne._id, adminOneDataComplete.householdName);
  adminOne = await updateUserHouseholdId(adminOne._id, householdOne._id);

  let userTwo = await createUser({userData : userTwoDataComplete, clientSocket: clientSocketUserTwo});
  userTwo = await updateUserHouseholdId(userTwo._id, householdOne._id);
  householdTwo = await updateHouseholdMembers(householdOne._id, householdOne.members, userTwo._id);

  const objectClientSocket = {
    clientSocketAdminOne,
    clientSocketUserTwo,
  };

  return { adminOne, householdOne, userTwo, objectClientSocket };
};

const createNotif = async (objectNotifData) => {
  let createRequestNotif = await new Notification(objectNotifData);
  await createRequestNotif.save();
};

module.exports.createUsersSwitchAdminRights = async (withSocket) => {
  return await createUsers(withSocket);
}

module.exports.createErrorTest = async (testName) => {
  const { adminOne, householdOne, userTwo } = await createUsers();

  const accessTokenAdminOne = await login(adminOneDataComplete.email, adminOneDataComplete.password);

  let objectData = {
    householdId : householdOne._id,
    userId : userTwo._id
  };

  if(testName === "badHouseholdId") objectData.householdId = "606dad080ac1c22766b37a53";
  if(testName === "badUserId") objectData.userId = "606dad080ac1c22766b37a53";

  if(testName === "otherRequestAdminNotif") 
    await createNotif({
      message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'administrateur.trice actuel.le, acceptez-vous cette requête?",
      householdId: householdOne._id,
      userId: userTwo._id,
      senderUserId: adminOne._id,
      type: "request-admin",
      urlRequest: "switch-admin-rights-respond",
    });


  if(testName === "otherNeedSwitchAdminNotif")
    await createNotif({
      message: `L'administrateur.trice de la famille vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`,
      householdId: householdOne._id,
      userId: adminOne._id,
      type: "need-switch-admin",
      urlRequest: "add-user-respond",
    });

  const response = await switchAdminRightsRequest(objectData, accessTokenAdminOne);

  return {statusCode : response.statusCode, error : JSON.parse(response.error.text)};
};

module.exports.switchAdminRightsRequest = async ({adminOne, householdOne, userTwo}) => {
  const accessTokenAdminOne = await login(adminOneDataComplete.email, adminOneDataComplete.password);

  let objectData = {
    householdId : householdOne._id,
    userId : userTwo._id
  };
  const response = await switchAdminRightsRequest(objectData, accessTokenAdminOne);

  const checkNotification = await Notification.findOne({
    userId: userTwo._id,
    householdId : householdOne._id,
    senderUserId : adminOne._id,
    type: "request-admin"
  });

  return {statusCode : response.statusCode, checkNotification};
};

