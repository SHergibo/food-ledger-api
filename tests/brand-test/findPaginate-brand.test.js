const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { createBrands } = require('./brand-helper/createBrands.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find paginate brands", () => {
  it("Test 1) test find paginate brands", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    const brandsArray = await createBrands({householdId : adminOne.householdId});

    const response = await routeRequest({route: `brands/pagination/${adminOne.householdId}?page=0`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    for (const brand of response.body.arrayData) {
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

    expect(response.body.totalData).toBe(15);
    expect(response.body.arrayData.findIndex(el => el._id.toString() === brandsArray[14]._id.toString())).toBe(-1);

  });
});