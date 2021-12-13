const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { createProductLog } = require('./productLog-helper/createProductLog.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find all product log", () => {
  it("Test 1) find all product log", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    const productLogArray = await createProductLog({householdId : adminOne.householdId, userId : adminOne._id});

    const response = await routeRequest({route: `product-logs/pagination/${adminOne.householdId}?page=0`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
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

    expect(response.body.totalData).toBe(2);
  });
});