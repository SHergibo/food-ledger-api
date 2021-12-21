const { createFourUsersAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createNotification } = require('./notification-helper/createNotification.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find paginate received notification", () => {
  it("Test 1) test find paginate received notification for adminOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-received-notification/${adminOne.userData._id}?page=0`, restType : "get", accessToken : adminOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifReceived[index][key]);
        }
      }
    }

    expect(response.body.totalNotifReceived).toBe(notificationObject.adminOne.notifReceived.length);

  });
  it("Test 2) test find paginate received notification for userOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-received-notification/${userOne.userData._id}?page=0`, restType : "get", accessToken : userOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.userOne.notifReceived[index][key].toString());
        } else if(key !== "householdId") {
          expect(data[key]).toBe(notificationObject.userOne.notifReceived[index][key]);
        }
      }
    }

    expect(response.body.totalNotifReceived).toBe(notificationObject.userOne.notifReceived.length);

  });
});