const request = require("supertest");
const app = require("../config/app.config");
const { api } = require('../config/environment.config');
const Household = require('../api/models/household.model');
const Notification = require('../api/models/notification.model');
const User = require('../api/models/user.model');

const { dbManagement, login, createAddUserRequestTest } = require('./test-utils');
dbManagement();

const createErrorTest = async (adminData, urlRequest) => {
  await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

  const accessTokenAdmin = await login(adminData.email, adminData.password);

  const res = await request(app)
    .get(`/api/${api}/requests/add-user-respond/${urlRequest}`)
    .set('Authorization', `Bearer ${accessTokenAdmin}`);

  return {statusCode : res.statusCode, error : JSON.parse(res.error.text)};
};

describe("Test addUserRespond", () => {
  it("Send add user request without acceptedRequest query", async () => {
    const url = 'no-notification-id';
    const res = await createErrorTest(adminDataComplete, url);
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toBe("Besoin d'un paramètre de requête!");
  });
  it("Send add user request with a wrong acceptedRequest query", async () => {
    const url = 'no-notification-id?acceptedRequest=oui';
    const res = await createErrorTest(adminDataComplete, url);
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toBe("Paramètre de requête invalide!");
  });
  it("Send add user request with a bad otherMember query", async () => {
    const url = 'no-notification-id?acceptedRequest=yes&otherMember=606dad080ac1c22766b37a53';
    const res = await createErrorTest(adminDataComplete, url);
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toBe("Code utilisateur du/de la délégué.e non trouvé!");
  });
  it("Send add user request with a bad notification id", async () => {
    const url = '606dad080ac1c22766b37a53?acceptedRequest=yes';
    const res = await createErrorTest(adminDataComplete, url);
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toBe("Notification non trouvée!");
  });
  it("Send add user request with a wrong notification id", async () => {
    let createWrongNotification = await new Notification({
      message: "Mauvaise notification test",
      householdId: "606dad080ac1c22766b37a53",
      userId: "606dad080ac1c22766b37a53",
      type: "need-switch-admin",
      urlRequest: "delegate-admin"
    });
    await createWrongNotification.save();

    const url = `${createWrongNotification._id}?acceptedRequest=yes`
    const res = await createErrorTest(adminDataComplete, url);
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toBe("Mauvaise notification!");
  });
  it("Test if another notification of type request-admin exist", async () => {
    let createGoodNotification = await new Notification({
      message: "Mauvaise notification test",
      householdId: "606dad080ac1c22766b37a53",
      userId: "606dad080ac1c22766b37a53",
      type: "need-switch-admin",
      urlRequest: "add-user-respond"
    });
    await createGoodNotification.save();

    const admin = await request(app)
      .post(`/api/${api}/users`)
      .send(adminDataComplete);

    let createNotificationRequestAdmin = await new Notification({
      message: "Notification request admin",
      householdId: "606dad080ac1c22766b37a53",
      userId: "606dad080ac1c22766b37a53",
      senderUserId: admin.body._id,
      type: "request-admin",
      urlRequest: "switch-admin-rights-respond",
    });
    await createNotificationRequestAdmin.save();

    const accessTokenAdmin = await login(adminDataComplete.email, adminDataComplete.password);

    const res = await request(app)
      .get(`/api/${api}/requests/add-user-respond/${createGoodNotification._id}?acceptedRequest=yes`)
      .set('Authorization', `Bearer ${accessTokenAdmin}`);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.error.text).isBoom).toBe(true);
    expect(JSON.parse(res.error.text).output.payload.message).toBe("Vous ne pouvez pas déléguer vos droits d'administrations si une autre requête de délégation de droits est en cour!");
  });
  it("Send addUser request from admin to user and the user reject the offer", async () => {
    const { admin, user, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminDataComplete, userDataComplete);

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
  it("Send addUser request from admin to user and the user accept the offer", async () => {
    const { user, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminDataComplete, userDataComplete);

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
};