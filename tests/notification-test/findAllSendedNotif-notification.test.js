const { createFourUsersAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createNotification } = require('./notification-helper/createNotification.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find all sended notification", () => {
  it("Test 1) test find all sended notification for adminOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/sended-notification/${adminOne.userData._id}`, restType : "get", accessToken : adminOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifSended[index][key]);
        }
      }
    }

  });
  it("Test 2) test find all sended notification for userOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/sended-notification/${userOne.userData._id}`, restType : "get", accessToken : userOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.userOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.userOne.notifSended[index][key]);
        }
      }
    }

  });
});