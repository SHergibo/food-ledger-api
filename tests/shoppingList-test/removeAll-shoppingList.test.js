const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { createShoppingList } = require('./shoppingList-helper/createShoppingList.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      ShoppingList = require('../../api/models/shopping-list.model');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove all shopping list", () => {
  it("Test 1) remove all shopping list", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    await createShoppingList({householdId : adminOne.householdId, userId : adminOne._id});

    let socketToShoppingList;
    objectClientSocket.clientSocketAdminOne.on("updateDataArray", (data) => {
      socketToShoppingList = data;
    });

    const response = await routeRequest({route: `shopping-lists/delete-all/${adminOne.householdId}`, restType : "delete", accessToken : responseLogin.body.token.accessToken});

    const deletedAllShoppingList = await ShoppingList.find({householdId : adminOne.householdId});

    expect(response.statusCode).toBe(204);
    expect(deletedAllShoppingList).toEqual([]);
    expect(socketToShoppingList.arrayData).toEqual([]);
    expect(socketToShoppingList.totalData).toBe(0);
   
    disconnectSocketClient(objectClientSocket);
  });
});