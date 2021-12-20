const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createProductLog } = require('./productLog-helper/createProductLog.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      ProductLog = require('../../api/models/product-log.model');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove one product log", () => {
  it("Test 1) remove one product log with productLogId", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    const productLogArray = await createProductLog({householdId : adminOne.householdId, userId : adminOne._id});

    let socketToProductLog;
    objectClientSocket.clientSocket.on("updateDataArray", (data) => {
      socketToProductLog = data;
    });

    const response = await routeRequest({route: `product-logs/${productLogArray[0]._id}`, restType : "delete", accessToken : responseLogin.body.token.accessToken});

    const deletedProductLog = await ProductLog.findById(productLogArray[0]._id);

    expect(response.statusCode).toBe(204);
    expect(deletedProductLog).toBeNull();

    productLogArray.shift();
    for (const [index, data] of socketToProductLog.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id" || key === "householdId"){
          expect(data[key].toString()).toBe(productLogArray[index][key].toString());
        } else if(key === "user") {
          expect(data[key]._id.toString()).toBe(productLogArray[index][key]._id.toString());
        } else if(key === "createdAt") {
          date = new Date(data[key]);
          expect(date.toString()).toBe(productLogArray[index][key].toString());
        } else {
          expect(data[key]).toBe(productLogArray[index][key]);
        }
      }
    }

    disconnectSocketClient(objectClientSocket);
  });
});