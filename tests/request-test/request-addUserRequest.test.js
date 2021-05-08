const { createErrorTest, createAddUserRequestTestOne, createAddUserRequestTestTwo, createAddUserRequestTestThree } = require('./request-helper/addUserRequest.helper'),
      { adminOneDataComplete, adminTwoDataComplete } = require('../test-data');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test addUserRequest controller", () => {
  it("Test 1) send add user request with bad usercode", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "badUserCode");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Code utilisateur non valide!");
  });
  it("Test 2) send add user request with bad householdCode", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "badHouseholdCode");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Code famille non valide!");
  });
  it("Test 3) send add user request to a household who is isWaiting", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "householdIsWaiting");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Vous ne pouvez pas envoyer une requête d'invitation à cette famille car elle n'a, en ce moment, pas d'administrateur.trice!");
  });
  it("Test 4) Test anti spam add user request notification", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "spamNotification");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Vous avez déjà envoyé ou reçu une invitation de cette personne!");
  });
  it("Test 5) Test if user is already in the admin household", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "sameHousehold");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Le membre fait déjà partie de cette famille !");
  });
  it("Test 6) Test if otherHousehold isWaiting", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "otherHouseholdIsWaiting");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("L'utilisateur.trice ne peut pas changer de famille en ce moment, car cette dernière n'a pas d'administrateur.trice!");
  });
  it("Test 7) Send addUser request from adminOne to adminTwo and test if invite household to user notification is created", async () => {
    const { addUser, user,  householdAdmin, notificationAddUser } = await createAddUserRequestTestOne(adminOneDataComplete, adminTwoDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(user._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(notificationAddUser.type).toBe("invitation-household-to-user");
  });
  it("Test 8) Send addUser request from adminOne to AdminTwo and test if need-switch-admin notification is created", async () => {
    const { addUser, adminTwo, householdAdminOne, notificationAddUser } = await createAddUserRequestTestTwo(adminOneDataComplete, adminTwoDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(adminTwo._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdminOne._id.toString());
    expect(notificationAddUser.type).toBe("need-switch-admin");
  });
  it("Test 9) Send addUser request from adminTwo to AdminOne and test if invitation user-to-household notification is created", async () => {
    const { addUser, adminTwo, householdAdminOne, notificationAddUser } = await createAddUserRequestTestThree(adminOneDataComplete, adminTwoDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.senderUserId.toString()).toBe(adminTwo._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdminOne._id.toString());
    expect(notificationAddUser.type).toBe("invitation-user-to-household");
  });
});
