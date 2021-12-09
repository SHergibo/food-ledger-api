const { createUser } = require('./createUserManagement.helper'),
      { adminOneDataComplete } = require('../test-data'),
      Client = require("socket.io-client"),
      { connectSocketClient } = require('../socket-io-management-utils');

const createOneAdmin = async (withSocket) => {
  let clientSocketAdminOne;
  if(withSocket){
    clientSocketAdminOne = Client(`http://localhost:8003`);
    connectSocketClient({clientSocketAdminOne});
  } 

  let adminOne = await createUser({userData : adminOneDataComplete, clientSocket: clientSocketAdminOne});

  adminOne = {
    _id : adminOne._id,
    email : adminOne.email,
    clearPasswordForTesting : adminOneDataComplete.password
  }

  const objectClientSocket = { clientSocketAdminOne };

  let returnedObject = { adminOne };
  if(objectClientSocket.clientSocketAdminOne) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};

module.exports.createOneUserAndLogin = async ({ withSocket, routeFunc, route }) => {
  const { adminOne, objectClientSocket } = await createOneAdmin(withSocket);

  let userCredentialsLogin = {
    email: adminOne.email,
    password: adminOne.clearPasswordForTesting
  };

  const responseLogin = await routeFunc({userCredentials: userCredentialsLogin, route});

  return { adminOne, responseLogin, objectClientSocket };
};