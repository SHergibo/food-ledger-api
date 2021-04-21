const request = require("supertest");
const app = require("../config/app.config");
const { api } = require('../config/environment.config');
const Household = require('../api/models/household.model');
const Notification = require('../api/models/notification.model');
const User = require('../api/models/user.model');

const { dbManagement, login } = require('./test-utils');
dbManagement();

const createDataTest = async (adminData, userData) => {
  const admin = await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

    const user = await request(app)
    .post(`/api/${api}/users`)
    .send(userData);

    const accessTokenAdmin = await login(adminDataComplete.email, adminDataComplete.password);

    const householdAdmin = await Household.findById(admin.body.householdId);

    const addUser = await request(app)
    .post(`/api/${api}/requests/add-user-request`)
    .send({
      usercode : user.body.usercode,
      type: "householdToUser",
      householdCode: householdAdmin.householdCode
    })
    .set('Authorization', `Bearer ${accessTokenAdmin}`);

    const notificationAddUser = await Notification.findOne({
      userId : user.body._id,
      householdId : householdAdmin._id,
      type: "invitation-household-to-user"
    });

    return {admin: admin.body, user: user.body, addUser, householdAdmin, notificationAddUser}
}

describe("Test simple add user request", () => {
  it("Send addUser request from admin to user and test if notification is created", async () => {
    const { user, addUser, householdAdmin, notificationAddUser } = await createDataTest(adminDataComplete, userDataComplete);

    expect(addUser.statusCode).toBe(204);
    expect(notificationAddUser.userId.toString()).toBe(user._id.toString());
    expect(notificationAddUser.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(notificationAddUser.type).toBe("invitation-household-to-user");
  });
  it("Send addUser request from admin to user and user reject the offer", async () => {
    const { admin, user, householdAdmin, notificationAddUser } = await createDataTest(adminDataComplete, userDataComplete);

    const accessTokenUser = await login(userDataComplete.email, userDataComplete.password);

    const rejectAddUserRequest = await request(app)
    .get(`/api/${api}/requests/add-user-respond/${notificationAddUser._id}?acceptedRequest=no`)
    .set('Authorization', `Bearer ${accessTokenUser}`);

    const notificationAddUserDeleted = await Notification.findOne({
      userId : user._id,
      householdId : householdAdmin._id,
      type: "invitation-household-to-user"
    });

    const notificationInformation = await Notification.findOne({
      householdId : admin.householdId,
      type: "information"
    });

    const householdUser = await Household.findById(user.householdId);

    expect(rejectAddUserRequest.statusCode).toBe(204);
    expect(notificationAddUserDeleted).toBe(null);

    expect(notificationInformation.householdId.toString()).toBe(admin.householdId.toString());
    expect(notificationInformation.type).toBe("information");

    expect(user.householdId.toString()).toBe(householdUser._id.toString());
    expect(user._id.toString()).toBe(householdUser.userId.toString());
  });
  it("Send addUser request from admin to user and user accept the offer", async () => {
    const { user, householdAdmin, notificationAddUser } = await createDataTest(adminDataComplete, userDataComplete);

    const accessTokenUser = await login(userDataComplete.email, userDataComplete.password);

    const acceptAddUserRequest = await request(app)
    .get(`/api/${api}/requests/add-user-respond/${notificationAddUser._id}?acceptedRequest=yes`)
    .set('Authorization', `Bearer ${accessTokenUser}`);

    const notificationAddUserDeleted = await Notification.findOne({
      userId : user._id,
      householdId : householdAdmin._id,
      type: "invitation-household-to-user"
    });

    const householdUser = await Household.findById(user.householdId);
    const userAfterSwitchFamilly = await User.findById(user._id);
    const householAdminWithNewMember = await Household.findById(householdAdmin._id);
    const indexUserInHouseholdAdminMemberArray = householAdminWithNewMember.members.findIndex(member => member.userData.toString() === userAfterSwitchFamilly._id.toString())

    expect(acceptAddUserRequest.statusCode).toBe(204);
    expect(notificationAddUserDeleted).toBe(null);

    expect(householdUser.members.length).toBe(0);
    expect(userAfterSwitchFamilly.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(userAfterSwitchFamilly.role).toBe("user");
    expect(indexUserInHouseholdAdminMemberArray).toBe(1);
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

//1) créer un user1 avec une famille1 => ok
//2) créer un user2 avec une famille2 => ok
//3) Envoyer la requête add user de user1 a user2
//4) le user accepte
//5) test si notification de tel type avec tel id créer avant que le user2 accepte
// Quand il aura accepté => 
//test si notif est delete
//test si user2 et dans famille1 (test householdId/role pour user2 et array member dans famille 1)
//test si famille2 existe avec array member vide
