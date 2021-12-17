const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createShoppingList } = require('./shoppingList-helper/createShoppingList.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      ShoppingList = require('../../api/models/shopping-list.model');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove one shopping list", () => {
  it("Test 1) remove one shopping list with shoppingListId", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({withSocket: true, route : "auth/login" });
    const shoppingListArray = await createShoppingList({householdId : adminOne.householdId});

    let socketToShoppingList;
    objectClientSocket.clientSocketAdminOne.on("updateDataArray", (data) => {
      socketToShoppingList = data;
    });

    const response = await routeRequest({route: `shopping-lists/${shoppingListArray[0]._id}`, restType : "delete", accessToken : responseLogin.body.token.accessToken});

    const deletedShoppingList = await ShoppingList.findById(shoppingListArray[0]._id);

    expect(response.statusCode).toBe(204);
    expect(deletedShoppingList).toBeNull();

    shoppingListArray.shift();
    for (const [index, data] of socketToShoppingList.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(shoppingListArray[index][key].toString());
        } else if(key === "product") {
          expect(data[key]._id.toString()).toBe(shoppingListArray[index][key]._id.toString());
        }  else if(key === "createdAt") {
          date = new Date(data[key]);
          expect(date.toString()).toBe(shoppingListArray[index][key].toString());
        }else{
          expect(data[key]).toBe(shoppingListArray[index][key]);
        }
      }
    }

    disconnectSocketClient(objectClientSocket);
  });
});