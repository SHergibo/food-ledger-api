const { createFourUsersAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createNotification } = require('./notification-helper/createNotification.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper'),
      Notification = require('../../api/models/notification.model'),
      Moment = require('moment-timezone');

const { dbManagement } = require('../db-management-utils');
const { disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

describe("Test remove notification", () => {
  it("Test 1) Error test, send bad type query", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/${notificationObject.adminOne.notifReceived[0]._id}?type=wrongType`, restType : "delete", accessToken : adminOne.responseLogin.body.token.accessToken});

    expect(response.body.output.statusCode).toBe(400);
    expect(response.body.output.payload.message).toBe("Paramètre de requête invalide!");
  });
  it("Test 2) Error test, Attempt to delete request-delegate-admin notification", async () => {
    const {adminOne} = await createFourUsersAndLogin({ route : "auth/login" });

    let newNotification = await new Notification({
      message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'ancien.ne administrateur.trice, acceptez-vous cette requête ou passez l'administration à un.e autre membre de votre famille. Attention si vous êtes le/la dernier.ère membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée!",
      householdId: adminOne.householdId,
      userId: adminOne._id,
      type: "request-delegate-admin",
      urlRequest: "delegate-admin",
      expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
    });
    await newNotification.save();


    const response = await routeRequest({route: `notifications/${newNotification._id}`, restType : "delete", accessToken : adminOne.responseLogin.body.token.accessToken});

    expect(response.body.output.statusCode).toBe(403);
    expect(response.body.output.payload.message).toBe("Vous ne pouvez pas supprimer cette notification!");
  });
  it("Test 3) Delete notification sended without type and page query param", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({withSocket : true, route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    let deleteNotifReceived;
    userTwo.objectClientSocket.clientSocket.on("deleteNotificationReceived", (data) => {
      deleteNotifReceived = data;
    });

    const response = await routeRequest({route: `notifications/${notificationObject.adminOne.notifSended[0]._id}`, restType : "delete", accessToken : adminOne.responseLogin.body.token.accessToken});

    const checkDeletedNotif = await Notification.findById(notificationObject.adminOne.notifSended[0]._id);

    expect(response.statusCode).toBe(204);
    expect(deleteNotifReceived).toBe(notificationObject.adminOne.notifSended[0]._id.toString());
    expect(checkDeletedNotif).toBeNull();

    disconnectSocketClient({
      clientSocketAdminOne : adminOne.objectClientSocket.clientSocket,
      clientSocketUserOne : userOne.objectClientSocket.clientSocket,
      clientSocketAdminTwo : adminTwo.objectClientSocket.clientSocket,
      clientSocketUserTwo : userTwo.objectClientSocket.clientSocket,
    });
  });
  it("Test 4) Delete notification sended with type and page query param", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({withSocket : true, route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    let updateNotifArrayAdminOne = [];
    adminOne.objectClientSocket.clientSocket.on("updateNotifArray", (data) => {
      updateNotifArrayAdminOne = [...updateNotifArrayAdminOne, data];
    });

    let updateNotifArrayUserTwo = [];
    userTwo.objectClientSocket.clientSocket.on("updateNotifArray", (data) => {
      updateNotifArrayUserTwo = [...updateNotifArrayUserTwo, data];
    });

    let deleteNotifReceived;
    userTwo.objectClientSocket.clientSocket.on("deleteNotificationReceived", (data) => {
      deleteNotifReceived = data;
    });

    const response = await routeRequest({route: `notifications/${notificationObject.adminOne.notifSended[0]._id}?page=0&type=sended`, restType : "delete", accessToken : adminOne.responseLogin.body.token.accessToken});

    const checkDeletedNotif = await Notification.findById(notificationObject.adminOne.notifSended[0]._id);

    expect(deleteNotifReceived).toBe(notificationObject.adminOne.notifSended[0]._id.toString());

    notificationObject.adminOne.notifSended.shift();
    for (const [index, data] of updateNotifArrayAdminOne[0].arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifSended[index][key]);
        }
      }
    }
    expect(updateNotifArrayAdminOne[0].totalNotifSended).toBe(14);

    expect(updateNotifArrayUserTwo[0].arrayData.length).toBe(0);
    expect(updateNotifArrayUserTwo[0].totalNotifReceived).toBe(0);

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifSended[index][key]);
        }
      }
    }
    expect(response.body.totalNotifSended).toBe(14);

    expect(checkDeletedNotif).toBeNull();

    disconnectSocketClient({
      clientSocketAdminOne : adminOne.objectClientSocket.clientSocket,
      clientSocketUserOne : userOne.objectClientSocket.clientSocket,
      clientSocketAdminTwo : adminTwo.objectClientSocket.clientSocket,
      clientSocketUserTwo : userTwo.objectClientSocket.clientSocket,
    });
  });
  it("Test 5) Delete notification received with type and page query param", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({withSocket : true, route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    let updateNotifArrayAdminOne = [];
    adminOne.objectClientSocket.clientSocket.on("updateNotifArray", (data) => {
      updateNotifArrayAdminOne = [...updateNotifArrayAdminOne, data];
    });

    let deleteNotifReceived;
    adminOne.objectClientSocket.clientSocket.on("deleteNotificationReceived", (data) => {
      deleteNotifReceived = data;
    });

    const response = await routeRequest({route: `notifications/${notificationObject.adminOne.notifReceived[2]._id}?page=0&type=received`, restType : "delete", accessToken : adminOne.responseLogin.body.token.accessToken});

    const checkDeletedNotif = await Notification.findById(notificationObject.adminOne.notifReceived[2]._id);

    expect(deleteNotifReceived).toBe(notificationObject.adminOne.notifReceived[2]._id.toString());

    notificationObject.adminOne.notifReceived.splice(2, 1);
    for (const [index, data] of updateNotifArrayAdminOne[0].arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifReceived[index][key]);
        }
      }
    }
    expect(updateNotifArrayAdminOne[0].totalNotifReceived).toBe(14);

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifReceived[index][key]);
        }
      }
    }
    expect(response.body.totalNotifReceived).toBe(14);

    expect(checkDeletedNotif).toBeNull();

    disconnectSocketClient({
      clientSocketAdminOne : adminOne.objectClientSocket.clientSocket,
      clientSocketUserOne : userOne.objectClientSocket.clientSocket,
      clientSocketAdminTwo : adminTwo.objectClientSocket.clientSocket,
      clientSocketUserTwo : userTwo.objectClientSocket.clientSocket,
    });
  });
});