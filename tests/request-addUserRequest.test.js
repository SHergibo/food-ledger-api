const { createAddUserRequestTest } = require('./addUserRequest.helper'),
      { adminOneDataComplete, adminTwoDataComplete } = require('./test-data');

const { dbManagement } = require('./db-management-utils');

dbManagement();

describe("Test simple add user request", () => {
  it("Send addUser request from admin to user and test if notification is created", async () => {
    const { user, addUser, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminOneDataComplete, adminTwoDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(user._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(notificationAddUser.type).toBe("invitation-household-to-user");
  });
});