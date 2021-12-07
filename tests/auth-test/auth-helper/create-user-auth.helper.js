const { createUser } = require('../../global-helper/createUserManagement.helper'),
      { adminOneDataComplete } = require('../../test-data'),
      Client = require("socket.io-client");

module.exports.createUser = async (withSocket) => {
  let clientSocketAdminOne;
  if(withSocket) clientSocketAdminOne = Client(`http://localhost:8003`);

  let adminOne = await createUser({userData : adminOneDataComplete, clientSocket: clientSocketAdminOne});
  adminOne.clearPasswordForTesting = adminOneDataComplete.password;

  const objectClientSocket = { clientSocketAdminOne };

  let returnedObject = { adminOne };
  if(objectClientSocket.clientSocketAdminOne) returnedObject = {...returnedObject, objectClientSocket};

  return returnedObject;
};