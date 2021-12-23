const request = require("supertest"),
      app = require("./../../config/app.config"),
      { api } = require('./../../config/environment.config'),
      Household = require('./../../api/models/household.model'),
      { adminOneDataComplete, userDataMissing, userTwoDataComplete } = require('./../test-data'),
      Client = require("socket.io-client");

const { dbManagement } = require('../db-management-utils');
const { connectSocketClient, disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Add user", () => {
  it("1) Error test, add user with householdName/Code missing", async () => {
    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(userDataMissing);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.error.text).isBoom).toBe(true);
  });
  it("2) Add user with household name and without other member code", async () => {
    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    const household = await Household.findById(response.body.householdId);
    expect(response.statusCode).toBe(200);
    expect(response.body.householdId.toString()).toBe(household._id.toString());
    expect(response.body.role).toBe("admin");
    expect(household.userId.toString()).toBe(response.body._id.toString());
  });
  it("3) Add user with household name and bad other member codes (usercode doesn't exist and member is in isWaiting familly)", async () => {
    // const response = await request(app)
    // .post(`/api/${api}/users`)
    // .send(adminOneDataComplete);

    // const household = await Household.findById(response.body.householdId);
    // expect(response.statusCode).toBe(200);
    // expect(response.body.householdId.toString()).toBe(household._id.toString());
    // expect(response.body.role).toBe("admin");
    // expect(household.userId.toString()).toBe(response.body._id.toString());
  });
  it("4) Add user with household name and good other member codes", async () => {
    // const response = await request(app)
    // .post(`/api/${api}/users`)
    // .send(adminOneDataComplete);

    // const household = await Household.findById(response.body.householdId);
    // expect(response.statusCode).toBe(200);
    // expect(response.body.householdId.toString()).toBe(household._id.toString());
    // expect(response.body.role).toBe("admin");
    // expect(household.userId.toString()).toBe(response.body._id.toString());
  });
  it("5) Add user with household code", async () => {
    let clientSocketAdminOne = Client(`http://localhost:8003`);
    connectSocketClient({clientSocketAdminOne});

    const responseAdminOne = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: responseAdminOne.body._id});
    clientSocketAdminOne.emit('enterSocketRoom', {socketRoomName: `${responseAdminOne.body._id}/notificationReceived/0`});

    let updateNotifReceivedAdminOne;
    clientSocketAdminOne.on("updateNotificationReceived", (data) => {
      updateNotifReceivedAdminOne = data;
    });

    let updateNotifArrayAdminOne;
    clientSocketAdminOne.on("updateNotifArray", (data) => {
      updateNotifArrayAdminOne = data;
    });

    const householdCreated = await Household.findById(responseAdminOne.body.householdId);

    const responseUserTwo = await request(app)
    .post(`/api/${api}/users?householdCode=${householdCreated.householdCode}`)
    .send(userTwoDataComplete);

    expect(responseUserTwo.statusCode).toBe(200);
    expect(responseUserTwo.body.role).toBe("user");
    expect(responseUserTwo.body.householdId).toBeNull();

    expect(updateNotifReceivedAdminOne.message).toBe(`L'utilisateur.trice ${responseUserTwo.body.firstname} ${responseUserTwo.body.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`);
    expect(updateNotifReceivedAdminOne.type).toBe(`invitation-user-to-household`);

    expect(updateNotifArrayAdminOne.arrayData[0]._id.toString()).toBe(updateNotifReceivedAdminOne._id.toString());
    expect(updateNotifArrayAdminOne.arrayData[0].message).toBe(updateNotifReceivedAdminOne.message);
    expect(updateNotifArrayAdminOne.arrayData[0].type).toBe(updateNotifReceivedAdminOne.type);

    disconnectSocketClient({clientSocketAdminOne});
  });
});