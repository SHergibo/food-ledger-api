const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { createBrands } = require('./brand-helper/createBrands.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find all brands", () => {
  it("Test 1) test find all brands", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    const brandsArray = await createBrands({householdId : adminOne.householdId});

    const response = await routeRequest({route: `brands/find-all/${adminOne.householdId}`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    for (const brand of response.body) {
      let findBrandIndex = brandsArray.findIndex(el => el._id.toString() === brand._id.toString());
      for (const key in brand) {
        if(key === "_id"){
          expect(brand[key].toString()).toBe(brandsArray[findBrandIndex][key].toString());
        } else if(key === "brandName") {
          expect(brand[key].value).toBe(brandsArray[findBrandIndex][key].value);
          expect(brand[key].label).toBe(brandsArray[findBrandIndex][key].label);
        } else {
          expect(brand[key]).toBe(brandsArray[findBrandIndex][key]);
        }
      }
    }

  });
});