const { basicRouteAuth } = require('./auth-helper/route-auth.helper'),
      { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test logout and refresh auth controller", () => {
  it("Test 1) logout with no email", async () => {
    const {responseLogin} = await createOneUserAndLogin({ route : "auth/login" });

    const userCredentialsLogout = {
      email: null,
      refreshToken: responseLogin.body.token.refreshToken.token
    };

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "auth/logoutAndRefresh", accessToken : responseLogin.body.token.accessToken});

    expect(responseLogout.body.output.statusCode).toBe(400);
    expect(responseLogout.body.isBoom).toBe(true);
    expect(responseLogout.body.output.payload.message).toMatch("An email or a token is required to logout !");
  });
  it("Test 2) logout with no token", async () => {
    const {adminOne, responseLogin} = await createOneUserAndLogin({ route : "auth/login" });

    const userCredentialsLogout = {
      email: adminOne.email,
      refreshToken: null
    };

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "auth/logoutAndRefresh", accessToken : responseLogin.body.token.accessToken});

    expect(responseLogout.body.output.statusCode).toBe(400);
    expect(responseLogout.body.isBoom).toBe(true);
    expect(responseLogout.body.output.payload.message).toMatch("An email or a token is required to logout !");
  });
  it("Test 3) logout and refresh", async () => {
    const {adminOne, responseLogin, objectClientSocket} = await createOneUserAndLogin({ withSocket : true, route : "auth/login" });

    const userCredentialsLogout = {
      email: adminOne.email,
      refreshToken: responseLogin.body.token.refreshToken.token
    };

    let refreshData;
    objectClientSocket.clientSocketAdminOne.on("refreshData", () => {
      refreshData = true;
    });

    const responseLogout = await basicRouteAuth({userCredentials: userCredentialsLogout, route: "auth/logoutAndRefresh", accessToken : responseLogin.body.token.accessToken});

    // expect(refreshData).toBe(true);
    expect(responseLogout.statusCode).toBe(204);

    disconnectSocketClient(objectClientSocket);
  });
});