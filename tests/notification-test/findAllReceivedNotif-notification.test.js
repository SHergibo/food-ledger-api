const { createFourUsersAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createNotification } = require('./notification-helper/createNotification.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find all received notification", () => {
  it("Test 1) test find all received notification for adminOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/received-notification/${adminOne.userData._id}`, restType : "get", accessToken : adminOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifReceived[index][key]);
        }
      }
    }

  });
  it("Test 2) test find all received notification for userOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/received-notification/${userOne.userData._id}`, restType : "get", accessToken : userOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.userOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.userOne.notifReceived[index][key]);
        }
      }
    }

  });
});