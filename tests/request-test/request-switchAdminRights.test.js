const { createErrorTest, switchAdminRightsRequest } = require('./request-helper/switchAdminRights.helper');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test switchAdminRights request controller", () => {
  it("Test 1) send switch admin rights request with bad household id", async () => {
    const { statusCode, error } = await createErrorTest("badHouseholdId");

    expect(statusCode).toBe(404);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Cette famille n'existe pas!");
  });
  it("Test 2) test if another request-admin notification already exist", async () => {
    const { statusCode, error } = await createErrorTest("otherRequestAdminNotif");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Vous avez déjà une demande de délégation de droits administrateurs en attente! Supprimez votre ancienne demande pour pouvoir en effectuer une nouvelle.");
  });
  it("Test 3) test if another need-switch-admin notification already exist", async () => {
    const { statusCode, error } = await createErrorTest("otherNeedSwitchAdminNotif");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Vous avez déjà une demande de délégation de droits administrateurs en attente! Supprimez votre ancienne demande pour pouvoir en effectuer une nouvelle.");
  });
  it("Test 4) send switch admin rights request with bad user id", async () => {
    const { statusCode, error } = await createErrorTest("badUserId");

    expect(statusCode).toBe(404);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Cet.te utilisateur.trice n'existe pas!");
  });
  it("Test 5) send switch admin rights request", async () => {
    const { statusCode, checkNotification, adminOne, householdOne, userTwo } = await switchAdminRightsRequest();

    expect(statusCode).toBe(200);
    expect(checkNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(checkNotification.senderUserId.toString()).toBe(adminOne._id.toString());
    expect(checkNotification.householdId.toString()).toBe(householdOne._id.toString());
    expect(checkNotification.type).toMatch("request-admin");
  });
});