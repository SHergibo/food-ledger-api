const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { createBrands } = require('./brand-helper/createBrands.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find one brand", () => {
  it("Test 1) test find one brand", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    const brandsArray = await createBrands({householdId : adminOne.householdId});

    const response = await routeRequest({route: `brands/${brandsArray[0]._id}`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    for (const key in response.body) {
      if(key === "_id"){
        expect(response.body[key].toString()).toBe(brandsArray[0][key].toString());
      } else if(key === "brandName") {
        expect(response.body[key].value).toBe(brandsArray[0][key].value);
        expect(response.body[key].label).toBe(brandsArray[0][key].label);
      } else {
        expect(response.body[key]).toBe(brandsArray[0][key]);
      }
    }

  });
});