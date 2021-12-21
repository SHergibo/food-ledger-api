const { createFourUsersAndLogin } = require('../global-helper/createUserAndLogin.helper'),
      { createNotification } = require('./notification-helper/createNotification.helper'),
      { routeRequest } = require('../global-helper/routeRequest.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test find paginate sended notification", () => {
  it("Test 1) test find paginate sended notification for adminOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-sended-notification/${adminOne.userData._id}?page=0`, restType : "get", accessToken : adminOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifSended[index][key]);
        }
      }
    }

    expect(response.body.totalNotifSended).toBe(notificationObject.adminOne.notifSended.length);

  });

  it("Test 2) test find paginate sended notification for adminOne with page query to 1", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-sended-notification/${adminOne.userData._id}?page=1`, restType : "get", accessToken : adminOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        let indexNotif = notificationObject.adminOne.notifSended.length - response.body.arrayData.length;
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.adminOne.notifSended[indexNotif + index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.adminOne.notifSended[indexNotif + index][key]);
        }
      }
    }

    expect(response.body.totalNotifSended).toBe(notificationObject.adminOne.notifSended.length);

  });
  it("Test 3) test find paginate sended notification for userOne", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-sended-notification/${userOne.userData._id}?page=0`, restType : "get", accessToken : userOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.userOne.notifSended[index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.userOne.notifSended[index][key]);
        }
      }
    }

    expect(response.body.totalNotifSended).toBe(notificationObject.userOne.notifSended.length);

  });
  it("Test 4) test find paginate sended notification for userOne with page query to 1", async () => {
    const {adminOne, userOne, adminTwo, userTwo} = await createFourUsersAndLogin({ route : "auth/login" });
    const notificationObject = await createNotification({
      adminOne : adminOne.userData, 
      userOne : userOne.userData, 
      adminTwo : adminTwo.userData, 
      userTwo: userTwo.userData 
    });

    const response = await routeRequest({route: `notifications/pagination-sended-notification/${userOne.userData._id}?page=1`, restType : "get", accessToken : userOne.responseLogin.body.token.accessToken});

    for (const [index, data] of response.body.arrayData.entries()) {
      for (const key in data) {
        let indexNotif = notificationObject.userOne.notifSended.length - response.body.arrayData.length;
        if(key === "_id"){
          expect(data[key].toString()).toBe(notificationObject.userOne.notifSended[indexNotif + index][key].toString());
        } else if(key !== "userId") {
          expect(data[key]).toBe(notificationObject.userOne.notifSended[indexNotif + index][key]);
        }
      }
    }

    expect(response.body.totalNotifSended).toBe(notificationObject.userOne.notifSended.length);

  });
});