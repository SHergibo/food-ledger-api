const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createProductLog } = require('./productLog-helper/createProductLog.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      ProductLog = require('../../api/models/product-log.model');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove all product log", () => {
  it("Test 1) remove all product log", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    await createProductLog({householdId : adminOne.householdId, userId : adminOne._id});

    let socketToProductLog;
    objectClientSocket.clientSocketAdminOne.on("updateDataArray", (data) => {
      socketToProductLog = data;
    });

    const response = await routeRequest({route: `product-logs/delete-all/${adminOne.householdId}`, restType : "delete", accessToken : responseLogin.body.token.accessToken});

    const deletedAllProductLog = await ProductLog.find({householdId : adminOne.householdId});

    expect(response.statusCode).toBe(204);
    expect(deletedAllProductLog).toEqual([]);
    expect(socketToProductLog.arrayData).toEqual([]);
    expect(socketToProductLog.totalData).toBe(0);
   
    disconnectSocketClient(objectClientSocket);
  });
});