const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createShoppingList } = require('./shoppingList-helper/createShoppingList.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      ShoppingList = require('../../api/models/shopping-list.model');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find paginate shopping list", () => {
  it("Test 1) test find paginate shopping list", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });
    await createShoppingList({householdId : adminOne.householdId});

    const response = await routeRequest({route: `shopping-lists/download/${adminOne.householdId}`, restType : "get", accessToken : responseLogin.body.token.accessToken});
    
    const shoppingListArray = await ShoppingList.find({householdId : adminOne.householdId})      
    .populate({
      path: 'product',
      populate : {
        path: 'brand',
        select: {brandName: 1}
      },
      select: {
        name: 1,
        weight: 1,
      }
    })
    .populate({
      path: 'historic',
      populate : {
        path: 'brand',
        select: {brandName: 1}
      },
      select: {
        name: 1,
        weight: 1,
      }
    });

    for (const [index, shoppingList] of response.body.entries()) {
      for (const key in shoppingList) {
        if(key === "Nom"){
          expect(shoppingList[key]).toBe(shoppingListArray[index].product.name);
        } else if(key === "Marque") {
          expect(shoppingList[key]).toBe(shoppingListArray[index].product.brand.brandName.label);
        } else if(key === "Poids") {
          expect(shoppingList[key]).toBe(shoppingListArray[index].product.weight);
        } else if(key === "Nombre") {
          expect(shoppingList[key]).toBe(shoppingListArray[index].numberProduct);
        } 
      }
    }
  });
});