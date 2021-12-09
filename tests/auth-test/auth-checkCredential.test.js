const { createOneUserAndLogin } = require('../global-helper/createOneUserAndLogin.helper'),
      { basicRouteAuth } = require('./auth-helper/route-auth.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test login auth controller", () => {
  it("Test 1) send wrong email", async () => {
    let userCredentials = {
      email : "wrongEmail@gmail.com",
      password : "123456789"
    };
    
    const response = await basicRouteAuth({userCredentials, route: "check-credential"});

    expect(response.body.output.statusCode).toBe(401);
    expect(response.body.isBoom).toBe(true);
    expect(response.body.output.payload.message).toMatch("This email doesn't exist!");
  });
  it("Test 2) send wrong password", async () => {
    const {adminOne} = await createOneUserAndLogin({ route : "login" });

    let userCredentials = {
      email : adminOne.email,
      password : "wrongPassword"
    };

    const response = await basicRouteAuth({userCredentials, route: "check-credential"});

    expect(response.body.output.statusCode).toBe(401);
    expect(response.body.isBoom).toBe(true);
    expect(response.body.output.payload.message).toMatch("Wrong password!");
  });
  it("Test 3) send with good credentials", async () => {
    const {adminOne} = await createOneUserAndLogin({ route : "login" });

    let userCredentials = {
      email : adminOne.email,
      password : adminOne.clearPasswordForTesting
    }

    const response = await basicRouteAuth({userCredentials, route: "check-credential"});

    expect(response.statusCode).toBe(204);
  });
});