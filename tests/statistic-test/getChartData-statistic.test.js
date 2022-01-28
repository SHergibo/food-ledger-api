const {
    createOneUserAndLogin,
  } = require("../global-helper/createUserAndLogin.helper"),
  { createProduct } = require("./statistic-helper/createProduct.helper"),
  { routeRequest } = require("../global-helper/routeRequest.helper"),
  Moment = require("moment");

const { dbManagement } = require("../db-management-utils");

dbManagement();

describe("Test get chart data", () => {
  it("Test 1) test get chart data", async () => {
    const { adminOne, responseLogin } = await createOneUserAndLogin({
      route: "auth/login",
    });
    const createProductData = await createProduct({
      householdId: adminOne.householdId,
    });

    const response = await routeRequest({
      route: `statistics/chart-data/${adminOne.householdId}`,
      restType: "get",
      accessToken: responseLogin.body.token.accessToken,
    });

    expect(response.body.statistics.chartOne["2021"][11]).toBe(1);
    expect(response.body.statistics.chartTwo[0]).toBe(1);
    expect(response.body.statistics.chartThree[0]).toBe(createProductData.kcal);

    let currentWeek = Moment(new Date(), "MMDDYYYY").isoWeek() - 1;
    let currentYear = Moment(new Date(), "MMDDYYYY").year();
    expect(response.body.statistics.chartFour[currentYear][currentWeek]).toBe(
      1
    );
  });
});
