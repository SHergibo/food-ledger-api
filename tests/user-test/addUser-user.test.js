const request = require("supertest"),
      app = require("./../../config/app.config"),
      { api } = require('./../../config/environment.config'),
      Household = require('./../../api/models/household.model'),
      Notification = require('./../../api/models/notification.model'),
      Moment = require('moment-timezone'),
      { adminOneDataComplete, userDataMissing, userTwoDataComplete, userFourDataComplete } = require('./../test-data'),
      { createUser } = require('../global-helper/createUserManagement.helper'),
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
    let userOne = await createUser({userData : userTwoDataComplete});

    let newNotification = await new Notification({
      message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'ancien.ne administrateur.trice, acceptez-vous cette requête ou passez l'administration à un.e autre membre de votre famille. Attention si vous êtes le/la dernier.ère membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée!",
      householdId: "606dad080ac1c22766b37a53",
      userId: userOne._id,
      type: "request-delegate-admin",
      urlRequest: "delegate-admin",
      expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
    });
    await newNotification.save();

    adminOneDataComplete.othermember = [userOne.usercode, "ksdjfhsjfkds"];

    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    expect(response.body.data[0].usercode).toBe(userOne.usercode);
    expect(response.body.data[0].errorType).toBe("userIsWaiting");
    expect(response.body.data[1].usercode).toBe("ksdjfhsjfkds");
    expect(response.body.data[1].errorType).toBe("userCodeNotFound");
    expect(response.body.output.statusCode).toBe(400);
    expect(JSON.parse(response.error.text).isBoom).toBe(true);
    expect(response.body.output.payload.message).toBe("Il y a un ou plusieurs problèmes avec certains de vos codes utilisateurs!");
  });
  it("4) Add user with household name and good other member codes", async () => {
    let clientSocketAdminOne = Client(`http://localhost:8003`);
    let clientSocketUserOne = Client(`http://localhost:8003`);
    let clientSocketUserTwo = Client(`http://localhost:8003`);
    connectSocketClient({clientSocketAdminOne, clientSocketUserOne,clientSocketUserTwo});

    let userOne = await createUser({clientSocket : clientSocketUserOne, userData : userTwoDataComplete});
    let userTwo = await createUser({clientSocket : clientSocketUserTwo, userData : userFourDataComplete});

    let updateNotifReceivedUserOne;
    clientSocketUserOne.on("updateNotificationReceived", (data) => {
      updateNotifReceivedUserOne = data;
    });

    let updateNotifArrayUserOne = [];
    clientSocketUserOne.on("updateNotifArray", (data) => {
      updateNotifArrayUserOne = [...updateNotifArrayUserOne, data];
    });

    let updateNotifReceivedUserTwo;
    clientSocketUserTwo.on("updateNotificationReceived", (data) => {
      updateNotifReceivedUserTwo = data;
    });

    let updateNotifArrayUserTwo = [];
    clientSocketUserTwo.on("updateNotifArray", (data) => {
      updateNotifArrayUserTwo = [...updateNotifArrayUserTwo, data];
    });

    adminOneDataComplete.othermember = [userOne.usercode, userTwo.usercode];

    const response = await request(app)
    .post(`/api/${api}/users`)
    .send(adminOneDataComplete);

    const household = await Household.findById(response.body.householdId);
    expect(response.statusCode).toBe(200);
    expect(response.body.householdId.toString()).toBe(household._id.toString());
    expect(response.body.role).toBe("admin");
    expect(household.userId.toString()).toBe(response.body._id.toString());

    expect(updateNotifReceivedUserOne.message).toBe(`L'administrateur.trice de la famille ${household.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`);
    expect(updateNotifReceivedUserOne.type).toBe(`invitation-household-to-user`);

    expect(updateNotifArrayUserOne[0].arrayData[0]._id.toString()).toBe(updateNotifReceivedUserOne._id.toString());
    expect(updateNotifArrayUserOne[0].arrayData[0].message).toBe(updateNotifReceivedUserOne.message);
    expect(updateNotifArrayUserOne[0].arrayData[0].type).toBe(updateNotifReceivedUserOne.type);

    expect(updateNotifReceivedUserTwo.message).toBe(`L'administrateur.trice de la famille ${household.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`);
    expect(updateNotifReceivedUserTwo.type).toBe(`invitation-household-to-user`);

    expect(updateNotifArrayUserTwo[0].arrayData[0]._id.toString()).toBe(updateNotifReceivedUserTwo._id.toString());
    expect(updateNotifArrayUserTwo[0].arrayData[0].message).toBe(updateNotifReceivedUserTwo.message);
    expect(updateNotifArrayUserTwo[0].arrayData[0].type).toBe(updateNotifReceivedUserTwo.type);

    disconnectSocketClient({clientSocketAdminOne, clientSocketUserOne,clientSocketUserTwo});
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