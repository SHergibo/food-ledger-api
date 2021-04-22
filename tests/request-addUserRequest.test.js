const { dbManagement, createAddUserRequestTest } = require('./test-utils');
dbManagement();

describe("Test simple add user request", () => {
  it("Send addUser request from admin to user and test if notification is created", async () => {
    const { user, addUser, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminDataComplete, userDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(user._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(notificationAddUser.type).toBe("invitation-household-to-user");
  });
});

const adminDataComplete = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'johnDoe@test.com',
    password: '123456789',
    role : 'admin',
    householdName: "Familly-Doe"
};

const userDataComplete = {
  firstname: 'David',
  lastname: 'Doe',
  email: 'DavidDoe@test.com',
  password: '123456789',
  role : 'admin',
  householdName: "Familly-DavidDoe"
}