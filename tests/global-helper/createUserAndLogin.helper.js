const { createUser, createHousehold, updateUserHouseholdId, updateHouseholdMembers } = require('./createUserManagement.helper'),
      { basicRouteAuth } = require('../auth-test/auth-helper/route-auth.helper'),
      { adminOneDataComplete, userTwoDataComplete, adminTwoDataComplete, userFourDataComplete } = require('../test-data'),
      Client = require("socket.io-client"),
      { connectSocketClient } = require('../socket-io-management-utils');

const createOneAdmin = async ({withSocket, userData}) => {
  let clientSocket;
  if(withSocket){
    clientSocket = Client(`http://localhost:8003`);
    await connectSocketClient({clientSocket});
  } 

  let admin = await createUser({userData : userData, clientSocket});
  const household = await createHousehold(admin._id, userData.householdName);
  admin = await updateUserHouseholdId(admin._id, household._id);

  if(withSocket){
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${admin.householdId}/productLog/0`});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${admin.householdId}/brand/0`});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${admin.householdId}/shoppingList/0`});
  }
  
  user = {
    _id : admin._id,
    email : admin.email,
    householdId: admin.householdId,
    clearPasswordForTesting : userData.password
  }

  const objectClientSocket = { clientSocket };

  let returnedObject = { user, household };
  if(objectClientSocket.clientSocket) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};

const createOneUser = async ({withSocket, household, userData}) => {
  let clientSocket;
  if(withSocket){
    clientSocket = Client(`http://localhost:8003`);
    await connectSocketClient({clientSocket});
  } 

  let user = await createUser({userData : userData, clientSocket: clientSocket});
  user = await updateUserHouseholdId(user._id, household._id);
  household = await updateHouseholdMembers(household._id, household.members, user._id);

  if(withSocket){
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${user.householdId}/productLog/0`});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${user.householdId}/brand/0`});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${user.householdId}/shoppingList/0`});
  }
  
  user = {
    _id : user._id,
    email : user.email,
    householdId: user.householdId,
    clearPasswordForTesting : userData.password
  }

  const objectClientSocket = { clientSocket };

  let returnedObject = { user };
  if(objectClientSocket.clientSocket) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};

module.exports.createOneUserAndLogin = async ({ withSocket, route }) => {
  const { user, objectClientSocket } = await createOneAdmin({withSocket, userData: adminOneDataComplete});

  let userCredentialsLogin = {
    email: user.email,
    password: user.clearPasswordForTesting
  };

  const responseLogin = await basicRouteAuth({userCredentials: userCredentialsLogin, route});

  return { adminOne: user, responseLogin, objectClientSocket };
};

module.exports.createTwoUsersAndLogin = async ({ withSocket, route }) => {
  const adminOneData = await createOneAdmin({withSocket, userData: adminOneDataComplete});
  const userOneData = await createOneUser({withSocket, household: adminOneData.household, userData: userTwoDataComplete});

  let admineOneCredentialsLogin = {
    email: adminOneData.user.email,
    password: adminOneData.user.clearPasswordForTesting
  };

  const responseLoginAdminOne = await basicRouteAuth({userCredentials: admineOneCredentialsLogin, route});

  let userOneCredentialsLogin = {
    email: userOneData.user.email,
    password: userOneData.user.clearPasswordForTesting
  };

  const responseLoginUserOne = await basicRouteAuth({userCredentials: userOneCredentialsLogin, route});

  return { 
    adminOne : { userData : adminOneData.user, responseLogin : responseLoginAdminOne, objectClientSocket : adminOneData.objectClientSocket },
    userOne : { userData : userOneData.user, responseLogin : responseLoginUserOne, objectClientSocket : userOneData.objectClientSocket },
  };
};

module.exports.createFourUsersAndLogin = async ({ withSocket, route }) => {
  const adminOneData = await createOneAdmin({withSocket, userData: adminOneDataComplete});
  const userOneData = await createOneUser({withSocket, household: adminOneData.household, userData: userTwoDataComplete});

  const adminTwoData = await createOneAdmin({withSocket, userData: adminTwoDataComplete});
  const userTwoData = await createOneUser({withSocket, household: adminTwoData.household, userData: userFourDataComplete});

  const userObject = {
    adminOne : adminOneData,
    userOne : userOneData,
    adminTwo : adminTwoData,
    userTwo : userTwoData,
  };

  let returnObject = {};
  for (const key in userObject) {
    const responseLogin = await basicRouteAuth(
      {userCredentials: {
        email: userObject[key].user.email,
        password: userObject[key].user.clearPasswordForTesting
      }, 
      route
    });
    returnObject[key] = {
      userData : userObject[key].user, responseLogin : responseLogin, objectClientSocket : userObject[key].objectClientSocket
    }
  }

  return returnObject;
};