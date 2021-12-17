const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createShoppingList } = require('./shoppingList-helper/createShoppingList.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find paginate shopping list", () => {
  it("Test 1) test find paginate shopping list", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    const shoppingListArray = await createShoppingList({householdId : adminOne.householdId});

    const response = await routeRequest({route: `shopping-lists/pagination/${adminOne.householdId}?page=0`, restType : "get", accessToken : responseLogin.body.token.accessToken});

    for (const [index, shoppingList] of response.body.arrayData.entries()) {
      for (const key in shoppingList) {
        if(key === "_id"){
          expect(shoppingList[key].toString()).toBe(shoppingListArray[index][key].toString());
        } else if(key === "product") {
          expect(shoppingList[key]._id.toString()).toBe(shoppingListArray[index][key]._id.toString());
        } else if(key === "createdAt") {
          date = new Date(shoppingList[key]);
          expect(date.toString()).toBe(shoppingListArray[index][key].toString());
        }else{
          expect(shoppingList[key]).toBe(shoppingListArray[index][key]);
        }
      }
    }

    expect(response.body.totalData).toBe(15);
    expect(response.body.arrayData.findIndex(el => el._id.toString() === shoppingListArray[14]._id.toString())).toBe(-1);
  });
});