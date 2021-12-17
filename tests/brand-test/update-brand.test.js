const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createBrands } = require('./brand-helper/createBrands.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();


describe("Test update brand", () => {
  it("Test 1) test update brand", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    const brandsArray = await createBrands({householdId : adminOne.householdId});

    const updatedBrand = {
      brandName: {
        label: `brandUpdated-0`,
        value: `brandUpdated-0`
      },
      numberOfProduct: 0,
      numberOfHistoric: 1,
    };

    let socketToBrand;
    objectClientSocket.clientSocketAdminOne.on("updatedData", (data) => {
      socketToBrand = data;
    });

    const response = await routeRequest({route: `brands/${brandsArray[0]._id}`, restType : "patch", sendedObject: updatedBrand, accessToken : responseLogin.body.token.accessToken});

    for (const key in response.body) {
      if(key === "brandName") {
        expect(response.body[key].value).toBe(updatedBrand[key].value);
        expect(response.body[key].label).toBe(updatedBrand[key].label);

        expect(response.body[key].value).toBe(socketToBrand[key].value);
        expect(response.body[key].label).toBe(socketToBrand[key].label);
      } else if(key !== "_id" && key !== "isBeingEdited") {
        expect(response.body[key]).toBe(updatedBrand[key]);
        expect(response.body[key]).toBe(socketToBrand[key]);
      }
    }

    disconnectSocketClient(objectClientSocket);
  });
});