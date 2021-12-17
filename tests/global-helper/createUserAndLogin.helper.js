const { createUser, createHousehold, updateUserHouseholdId, updateHouseholdMembers } = require('./createUserManagement.helper'),
      { basicRouteAuth } = require('../auth-test/auth-helper/route-auth.helper'),
      { adminOneDataComplete, userTwoDataComplete } = require('../test-data'),
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
    clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${adminOne.householdId}/shoppingList/0`});
  }
  
  adminOne = {
    _id : adminOne._id,
    email : adminOne.email,
    householdId: adminOne.householdId,
    clearPasswordForTesting : adminOneDataComplete.password
  }

  const objectClientSocket = { clientSocketAdminOne };

  let returnedObject = { adminOne, householdOne };
  if(objectClientSocket.clientSocketAdminOne) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};

const createOneUser = async (withSocket, householdOne) => {
  let clientSocketUserOne;
  if(withSocket){
    clientSocketUserOne = Client(`http://localhost:8003`);
    await connectSocketClient({clientSocketUserOne});
  } 

  let userOne = await createUser({userData : userTwoDataComplete, clientSocket: clientSocketUserOne});
  userOne = await updateUserHouseholdId(userOne._id, householdOne._id);
  householdOne = await updateHouseholdMembers(householdOne._id, householdOne.members, userOne._id);

  if(withSocket){
    clientSocketUserOne.emit('enterSocketRoom', {socketRoomName: `${userOne.householdId}/productLog/0`});
    clientSocketUserOne.emit('enterSocketRoom', {socketRoomName: `${userOne.householdId}/brand/0`});
    clientSocketUserOne.emit('enterSocketRoom', {socketRoomName: `${userOne.householdId}/shoppingList/0`});
  }
  
  userOne = {
    _id : userOne._id,
    email : userOne.email,
    householdId: userOne.householdId,
    clearPasswordForTesting : userTwoDataComplete.password
  }

  const objectClientSocketUserOne = { clientSocketUserOne };

  let returnedObject = { userOne };
  if(objectClientSocketUserOne.clientSocketUserOne) returnedObject = {...returnedObject, objectClientSocketUserOne};

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

module.exports.createTwoUserAndLogin = async ({ withSocket, route }) => {
  const { adminOne, householdOne, objectClientSocket } = await createOneAdmin(withSocket);
  const objectClientSocketAdminOne = objectClientSocket;
  const { userOne, objectClientSocketUserOne } = await createOneUser(withSocket, householdOne);

  let admineOneCredentialsLogin = {
    email: adminOne.email,
    password: adminOne.clearPasswordForTesting
  };

  const responseLoginAdminOne = await basicRouteAuth({userCredentials: admineOneCredentialsLogin, route});

  let userOneCredentialsLogin = {
    email: userOne.email,
    password: userOne.clearPasswordForTesting
  };

  const responseLoginUserOne = await basicRouteAuth({userCredentials: userOneCredentialsLogin, route});

  return { 
    adminOne : { adminOne, responseLoginAdminOne, objectClientSocketAdminOne },
    userOne : { userOne, responseLoginUserOne, objectClientSocketUserOne },
  };
};