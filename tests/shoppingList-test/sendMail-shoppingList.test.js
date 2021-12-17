const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createShoppingList } = require('./shoppingList-helper/createShoppingList.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test send shopping list email", () => {
  it("Test 1) test send shopping list email", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    await createShoppingList({householdId : adminOne.householdId});

    /* Comment everything after this line to not be spammed with testing emails */

    // const response = await routeRequest({route: `shopping-lists/send-mail/${adminOne.householdId}`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    // expect(response.statusCode).toBe(204);
  });
});