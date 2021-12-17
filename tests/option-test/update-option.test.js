const { createOneUserAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      Option = require('../../api/models/option.model');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test update one option", () => {
  it("Test 1) test update one option", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });

    const updateOption = {
      sendMailGlobal: true,
      dateMailGlobal: { value: 1, label: 'Tous les deux mois' },
      sendMailShoppingList: true,
      dateMailShoppingList: { value: 2, label: 'Toutes les trois semaines' },
      minimalProductStockGlobal: 0,
      updateAllMinimalProductStock: true,
      warningExpirationDate: { value: 1, label: "Deux mois à l'avance" },
      colorCodeDate: false,
      colorCodeStock: false,
      openMenu: true,
    };

    const response = await routeRequest({route: `options/${adminOne._id}`, restType : "patch", sendedObject : updateOption, accessToken : responseLogin.body.token.accessToken});

    for (const key in response.body) {
      if(key === "dateMailGlobal" || key === "dateMailShoppingList" || key === "warningExpirationDate") {
        expect(response.body[key].value).toBe(updateOption[key].value);
        expect(response.body[key].label).toBe(updateOption[key].label);
      } else if(key !== "_id" && key !== "userId") {
        expect(response.body[key]).toBe(updateOption[key]);
      }
    }
  });
});