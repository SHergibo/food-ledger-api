const { createErrorTest, createAddUserRequestTest } = require('./request-helper/addUserRequest.helper'),
      { adminOneDataComplete, adminTwoDataComplete } = require('../test-data');

const { dbManagement } = require('../db-management-utils');

dbManagement();

describe("Test addUserRequest controller", () => {
  it("Test1 ) send add user request with bad usercode", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "badUserCode");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Code utilisateur non valide!");
  });
  it("Test2 ) send add user request with bad householdCode", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "badHouseholdCode");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Code famille non valide!");
  });
  it("Test3 ) send add user request to a household who is isWaiting", async () => {
    const { statusCode, error } = await createErrorTest(adminOneDataComplete, adminTwoDataComplete, "householdIsWaiting");

    expect(statusCode).toBe(400);
    expect(error.isBoom).toBe(true);
    expect(error.output.payload.message).toMatch("Vous ne pouvez pas envoyer une requête d'invitation à cette famille car elle n'a, en ce moment, pas d'administrateur.trice!");
  });
  it("Send addUser request from admin to user and test if notification is created", async () => {
    const { user, addUser, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminOneDataComplete, adminTwoDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(user._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(notificationAddUser.type).toBe("invitation-household-to-user");
  });
});

// Test error
// 1) OK => test code utilisateur
// 2) OK => test code famille
// 3) Ok => test famille est en isWaiting true
// 4) test anti spam requête d'invitation
// 5) test si utilisateur est déjà dans la famille
// 6) test blocage envoie d'invite pour une personne dans une famille sans admin

// création d'invitation
// 1) création d'invitation household to user
  // => test notification type household-to-user/need-switch-admin (en fonction du role de l'utilisateur user/admin et du n° de membres dans la famille si admin)
  // => test message de la notification
  // => test userId
// 2) création d'invitation user to household
  // => test notification type user-to-household
  // => test message de la notification
  // => test senderUserId
