const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      Option = require('../../api/models/option.model');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find one option", () => {
  it("Test 1) test find one option", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });

    const response = await routeRequest({route: `options/${adminOne._id}`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    const userOptions = await Option.findOne({userId : adminOne._id});

    for (const key in response.body) {
      if(key === "_id" || key === "userId"){
        expect(response.body[key].toString()).toBe(userOptions[key].toString());
      } else if(key === "dateMailGlobal" || key === "dateMailShoppingList" || key === "warningExpirationDate") {
        expect(response.body[key].value).toBe(userOptions[key].value);
        expect(response.body[key].label).toBe(userOptions[key].label);
      } else {
        expect(response.body[key]).toBe(userOptions[key]);
      }
    }
  });
});