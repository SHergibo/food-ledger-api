const { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationRequestAdmin } = require('../test-data'),
      { createUsersSwitchAdminRights, switchAdminRightsRequest } = require('./request-helper/switchAdminRights.helper'),
      { switchAdminRightsRespondRequest } = require('./request-helper/switchAdminRightsRespond.helper');

const { dbManagement } = require('../db-management-utils');
const { connectSocketClient, disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

const URL_REQUEST = 'switch-admin-rights-respond';

describe("Test switchAdminRightsRespond request controller", () => {
  it("Test 1) send switchAdminRightsRespond request with a bad notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
    );
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Notification non trouvée!");
  });
  it("Test 2) send switchAdminRightsRespond request with a wrong notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Mauvaise notification!");
  });
  it("Test 3) send switchAdminRightsRespond request without acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationRequestAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Besoin d'un paramètre de requête!");
  });
  it("Test 4) send switchAdminRightsRespond request with a wrong acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationRequestAdmin,
      '?acceptedRequest=oui'
      );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Paramètre de requête invalide!");
  });
  it("Test 5) send switchAdminRightsRespond request with a wrong type query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationRequestAdmin,
      '?type=wrongTypeQuery'
      );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Paramètre de requête invalide!");
  });
  it("Test 6) accept request admin notification", async () => {
    const { adminOne, householdOne, userTwo, objectClientSocket } = await createUsersSwitchAdminRights({withSocket : true});
    connectSocketClient(objectClientSocket);

    const { checkNotification } = await switchAdminRightsRequest({adminOne, householdOne, userTwo});
    const { 
      statusCode, 
      deletedNotification, 
      adminOneAfterUpdate, 
      userTwoAfterUpdate, 
      householdOneAfterUpdate,
      userTwoIndex,
      adminOneNotifAfterUpdate,
      userTwoNotifAfterUpdate,
      adminOneNotifTransformed,
      userTwoNotifTransformed
    } = await switchAdminRightsRespondRequest(checkNotification, adminOne, userTwo, householdOne, 'yes');
    
    expect(statusCode).toBe(204);
    expect(deletedNotification).toBeNull();
    expect(adminOneAfterUpdate.role).toMatch("user");
    expect(userTwoAfterUpdate.role).toMatch("admin");
    expect(householdOneAfterUpdate.userId.toString()).toBe(userTwoAfterUpdate._id.toString());
    expect(userTwoIndex).toBe(0);
    expect(adminOneNotifAfterUpdate).toBeNull();
    expect(userTwoNotifAfterUpdate).toBeNull();
    expect(adminOneNotifTransformed.userId.toString()).toBe(adminOne._id.toString());
    expect(userTwoNotifTransformed.userId.toString()).toBe(userTwo._id.toString());

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 7) reject request admin notification", async () => {
    const { adminOne, householdOne, userTwo, objectClientSocket } = await createUsersSwitchAdminRights({withSocket : true});
    connectSocketClient(objectClientSocket);

    const { checkNotification } = await switchAdminRightsRequest({adminOne, householdOne, userTwo});

    let updateNotifReceivedAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateNotificationReceived", (data) => {
      updateNotifReceivedAdminOne = data;
    });
     
    let updateNotifAdminOne = {};
    objectClientSocket.clientSocketAdminOne.on("updateNotifArray", (data) => {
      if(Object.keys(data).find(key => key === 'totalNotifSended')) updateNotifAdminOne['updateSendedNotif'] = data;
      if(Object.keys(data).find(key => key === 'totalNotifReceived')) updateNotifAdminOne['updateReceivedNotif'] = data;
    });

    let deleteNotifReceivedUserTwo;
    objectClientSocket.clientSocketUserTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifReceivedUserTwo = data;
    });

    let updateNotifUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateNotifArray", (data) => {
      updateNotifUserTwo = data;
    });

    const { 
      statusCode, 
      deletedNotification, 
      adminOneAfterUpdate, 
      userTwoAfterUpdate, 
      householdOneAfterUpdate,
      userTwoIndex,
      adminOneNotifAfterUpdate,
      userTwoNotifAfterUpdate,
      adminOneNotifTransformed,
      userTwoNotifTransformed,
      informationNotif
    } = await switchAdminRightsRespondRequest(checkNotification, adminOne, userTwo, householdOne, 'no');

    expect(updateNotifReceivedAdminOne._id.toString()).toBe(updateNotifAdminOne.updateReceivedNotif.arrayData[1]._id.toString());
    expect(updateNotifReceivedAdminOne.type).toBe(updateNotifAdminOne.updateReceivedNotif.arrayData[1].type);

    expect(updateNotifAdminOne.updateReceivedNotif.arrayData[1].type).toBe("information");
    expect(updateNotifAdminOne.updateReceivedNotif.totalNotifReceived).toBe(2);

    expect(updateNotifAdminOne.updateSendedNotif.arrayData).toEqual([]);
    expect(updateNotifAdminOne.updateSendedNotif.totalNotifSended).toBe(0);

    expect(deleteNotifReceivedUserTwo).toBe(checkNotification._id.toString());

    expect(updateNotifUserTwo.arrayData[0]._id.toString()).toBe(userTwoNotifAfterUpdate._id.toString());
    expect(updateNotifUserTwo.arrayData[0].type).toBe(userTwoNotifAfterUpdate.type);
    expect(updateNotifUserTwo.totalNotifReceived).toBe(1);
    
    expect(statusCode).toBe(204);
    expect(deletedNotification).toBeNull();
    expect(adminOneAfterUpdate.role).toMatch("admin");
    expect(userTwoAfterUpdate.role).toMatch("user");
    expect(householdOneAfterUpdate.userId.toString()).toBe(adminOneAfterUpdate._id.toString());
    expect(userTwoIndex).toBe(1);
    expect(adminOneNotifAfterUpdate.userId.toString()).toBe(adminOne._id.toString());
    expect(userTwoNotifAfterUpdate.userId.toString()).toBe(userTwo._id.toString());
    expect(adminOneNotifTransformed).toBeNull()
    expect(userTwoNotifTransformed).toBeNull();
    expect(informationNotif.type).toMatch("information");

    disconnectSocketClient(objectClientSocket);
  });
});