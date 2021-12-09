const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { basicRouteAuth } = require('./auth-helper/route-auth.helper'),
      { checkRefreshToken } = require('./auth-helper/check-token-auth.helper'),
      RefreshToken = require('../../api/models/refresh-token.model');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test refresh auth controller", () => {
  it("Test 1) send wrong email", async () => {
    let userCredentials = {
      email : "wrongEmail@gmail.com",
      password : "123456789"
    }
    const response = await basicRouteAuth({userCredentials, route: "refresh-token"});

    expect(response.body.output.statusCode).toBe(401);
    expect(response.body.isBoom).toBe(true);
    expect(response.body.output.payload.message).toMatch("This email doesn't exist!");
  });
  it("Test 2) refresh auth roken", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "login" });

    const userCredentialsRefresh = {
      email: adminOne.email,
      refreshToken: responseLogin.body.token.refreshToken.token
    };

    const responseRefresh = await basicRouteAuth({userCredentials: userCredentialsRefresh, route: "refresh-token"});

    let oldRefreshToken = await RefreshToken.findOne({token : responseLogin.body.token.refreshToken.token, email: adminOne.email});

    const checkTokenData = await checkRefreshToken({tokenData: responseRefresh.body, userId : adminOne._id.toString()});

    expect(responseRefresh.statusCode).toBe(200);
    expect(oldRefreshToken).toBeNull();
    expect(checkTokenData.accessToken).toBe(true);
    expect(checkTokenData.type).toBe(true);
    expect(checkTokenData.refreshToken).toBe(true);
  });
});