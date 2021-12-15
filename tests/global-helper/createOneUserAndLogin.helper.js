const { createUser, createHousehold, updateUserHouseholdId } = require('./createUserManagement.helper'),
      { basicRouteAuth } = require('../auth-test/auth-helper/route-auth.helper'),
      { adminOneDataComplete } = require('../test-data'),
      Client = require("socket.io-client"),
      { connectSocketClient } = require('../socket-io-management-utils');

const createOneAdmin = async (withSocket) => {
  let clientSocketAdminOne;
  if(withSocket){
    clientSocketAdminOne = Client(`http://localhost:8003`);
    await connectSocketClient({clientSocketAdminOne});
  } 

  let adminOne = await createUser({userData : adminOneDataComplete, clientSocket: clientSocketAdminOne});
  const householdOne = await createHousehold(adminOne._id, adminOneDataComplete.householdName);
  adminOne = await updateUserHouseholdId(adminOne._id, householdOne._id);

  if(withSocket){
    clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${adminOne.householdId}/productLog/0`});
    clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${adminOne.householdId}/brand/0`});
  }
  
  adminOne = {
    _id : adminOne._id,
    email : adminOne.email,
    householdId: adminOne.householdId,
    clearPasswordForTesting : adminOneDataComplete.password
  }

  const objectClientSocket = { clientSocketAdminOne };

  let returnedObject = { adminOne };
  if(objectClientSocket.clientSocketAdminOne) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};

module.exports.createOneUserAndLogin = async ({ withSocket, route }) => {
  const { adminOne, objectClientSocket } = await createOneAdmin(withSocket);

  let userCredentialsLogin = {
    email: adminOne.email,
    password: adminOne.clearPasswordForTesting
  };

  const responseLogin = await basicRouteAuth({userCredentials: userCredentialsLogin, route});

  return { adminOne, responseLogin, objectClientSocket };
};