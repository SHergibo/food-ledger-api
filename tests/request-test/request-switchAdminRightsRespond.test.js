const { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationRequestAdmin } = require('../test-data'),
      { switchAdminRightsRequest } = require('./request-helper/switchAdminRights.helper'),
      { switchAdminRightsRespondRequest } = require('./request-helper/switchAdminRightsRespond.helper');

const { dbManagement } = require('../db-management-utils');

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
  it("Test 5) accept request admin notification", async () => {
    const { checkNotification, adminOne, userTwo, householdOne } = await switchAdminRightsRequest();
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
  });
  it("Test 6) reject request admin notification", async () => {
    const { checkNotification, adminOne, userTwo, householdOne } = await switchAdminRightsRequest();
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
  });
});