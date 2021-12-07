const { createUser } = require('./auth-helper/create-user-auth.helper'),
      { basicRouteAuth } = require('./auth-helper/route-auth.helper');

const { dbManagement } = require('../db-management-utils');
const { connectSocketClient, disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test logout auth controller", () => {
  it("Test 1) logout with no email", async () => {
    const { adminOne } = await createUser();

    let userCredentialsLogin = {
      email: adminOne.email,
      password: adminOne.clearPasswordForTesting
    };

    const responseLogin = await basicRouteAuth({userCredentials: userCredentialsLogin, route: "login"});

    const userCredentialsLogout = {
      email: null,
      refreshToken: responseLogin.body.token.refreshToken.token
    };

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "logout", accessToken : responseLogin.body.token.accessToken});

    expect(responseLogout.body.output.statusCode).toBe(400);
    expect(responseLogout.body.isBoom).toBe(true);
    expect(responseLogout.body.output.payload.message).toMatch("An email or a token is required to logout !");
  });
  it("Test 2) logout with no token", async () => {
    const { adminOne } = await createUser();

    let userCredentialsLogin = {
      email: adminOne.email,
      password: adminOne.clearPasswordForTesting
    };

    const responseLogin = await basicRouteAuth({userCredentials: userCredentialsLogin, route: "login"});

    const userCredentialsLogout = {
      email: adminOne.email,
      refreshToken: null
    };

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "logout", accessToken : responseLogin.body.token.accessToken});

    expect(responseLogout.body.output.statusCode).toBe(400);
    expect(responseLogout.body.isBoom).toBe(true);
    expect(responseLogout.body.output.payload.message).toMatch("An email or a token is required to logout !");
  });
  it("Test 3) logout", async () => {
    const { adminOne, objectClientSocket } = await createUser({withToken : true});
    connectSocketClient(objectClientSocket);

    let userCredentialsLogin = {
      email: adminOne.email,
      password: adminOne.clearPasswordForTesting
    };

    const responseLogin = await basicRouteAuth({userCredentials: userCredentialsLogin, route: "login"});

    const userCredentialsLogout = {
      email: adminOne.email,
      refreshToken: responseLogin.body.token.refreshToken.token
    };

    let logoutSameNavigator;
    objectClientSocket.clientSocketAdminOne.on("logoutSameNavigator", () => {
      logoutSameNavigator = true;
    });

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "logout", accessToken : responseLogin.body.token.accessToken});

    // expect(logoutSameNavigator).toBe(true);
    expect(responseLogout.statusCode).toBe(200);

    disconnectSocketClient(objectClientSocket);
  });
});