const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createBrands } = require('./brand-helper/createBrands.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      Brand = require('../../api/models/brand.model');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove one brand", () => {
  it("Test 1) remove one brand with brandId", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    const brandsArray = await createBrands({householdId : adminOne.householdId});

    let socketToBrand;
    objectClientSocket.clientSocketAdminOne.on("updateDataArray", (data) => {
      socketToBrand = data;
    });

    const response = await routeRequest({route: `brands/${brandsArray[0]._id}`, restType : "delete", accessToken : responseLogin.body.token.accessToken});

    const deletedBrand = await Brand.findById(brandsArray[0]._id);

    expect(response.statusCode).toBe(204);
    expect(deletedBrand).toBeNull();

    brandsArray.shift();
    for (const [index, data] of socketToBrand.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(brandsArray[index][key].toString());
        } else if(key === "brandName") {
          expect(data[key].value).toBe(brandsArray[index][key].value);
          expect(data[key].label).toBe(brandsArray[index][key].label);
        } else if(key !== "isBeingEdited") {
          expect(data[key]).toBe(brandsArray[index][key]);
        }
      }
    }

    disconnectSocketClient(objectClientSocket);
  });
});