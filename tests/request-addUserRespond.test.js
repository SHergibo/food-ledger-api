const request = require("supertest"),
      app = require("../config/app.config"),
      { api } = require('../config/environment.config'),
      Household = require('../api/models/household.model'),
      Notification = require('../api/models/notification.model'),
      User = require('../api/models/user.model'),
      { login } = require('./login.helper'),
      { createErrorTest } = require('./createErrorTestRequest.helper'),
      { createAddUserRequestTest } = require('./addUserRequest.helper'),
      { createAddUserRespondTest, acceptAddUserRequest, delegateWithOtherMember } = require('./addUserRespond.helper'),
      { adminOneDataComplete, adminTwoDataComplete, notificationDelegateAdmin, notificationAddUserRespond} = require('./test-data');

const { dbManagement } = require('./db-management-utils');
dbManagement();

const URL_REQUEST = "add-user-respond";

describe("Test addUserRespond", () => {
  it("Test 1) send add user request with a bad notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
    );
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Notification non trouvée!");
  });
  it("Test 2) send add user request with a wrong notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Mauvaise notification!");
  });
  it("Test 3) send add user request without acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationAddUserRespond
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Besoin d'un paramètre de requête!");
  });
  it("Test 4) send add user request with a wrong acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationAddUserRespond,
      '?acceptedRequest=oui'
      );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Paramètre de requête invalide!");
  });
  it("Test 5) test if another notification of type request-admin exist", async () => {
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
      .send(adminOneDataComplete);

    let createNotificationRequestAdmin = await new Notification({
      message: "Notification request admin",
      householdId: "606dad080ac1c22766b37a53",
      userId: "606dad080ac1c22766b37a53",
      senderUserId: admin.body._id,
      type: "request-admin",
      urlRequest: "switch-admin-rights-respond",
    });
    await createNotificationRequestAdmin.save();

    const accessTokenAdmin = await login(adminOneDataComplete.email, adminOneDataComplete.password);

    const res = await request(app)
      .get(`/api/${api}/requests/add-user-respond/${createGoodNotification._id}?acceptedRequest=yes`)
      .set('Authorization', `Bearer ${accessTokenAdmin}`);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.error.text).isBoom).toBe(true);
    expect(JSON.parse(res.error.text).output.payload.message).toMatch("Vous ne pouvez pas déléguer vos droits d'administrations si une autre requête de délégation de droits est en cour!");
  });
  it("Test 6) send addUser request from admin to user and the user reject the offer", async () => {
    const { admin, user, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminOneDataComplete, adminTwoDataComplete);

    const accessTokenUser = await login(adminTwoDataComplete.email, adminTwoDataComplete.password);

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
    expect(notificationAddUserDeleted).toBeNull();

    expect(notificationInformation.householdId.toString()).toBe(admin.householdId.toString());
    expect(notificationInformation.type).toMatch("information");

    expect(user.householdId.toString()).toBe(householdUser._id.toString());
    expect(user._id.toString()).toBe(householdUser.userId.toString());
  });
  it("Test 7) send addUser request from admin to user and the user accept the offer", async () => {
    const { user, householdAdmin, notificationAddUser } = await createAddUserRequestTest(adminOneDataComplete, adminTwoDataComplete);

    const accessTokenUser = await login(adminTwoDataComplete.email, adminTwoDataComplete.password);

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
    expect(notificationAddUserDeleted).toBeNull();

    expect(householdUser.members.length).toBe(0);
    expect(userAfterSwitchFamilly.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(userAfterSwitchFamilly.role).toMatch("user");
    expect(indexUserInHouseholdAdminMemberArray).toBe(1);
  });
  it("Test 8) create delegate Notification and check if that notification is created", async () => {
    const { householdOne, adminTwo } = await createAddUserRespondTest();
    const { addUserRequestResponse, notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);

    expect(addUserRequestResponse.statusCode).toBe(204);
    expect(notificationDelegateUser.userId.toString()).toBe(adminTwo._id.toString());
    expect(notificationDelegateUser.householdId.toString()).toBe(householdOne._id.toString());
    expect(notificationDelegateUser.type).toMatch("need-switch-admin");
  });
  it("Test 9) admin delegate admin rights with a wrong otherMember query", async () => {
    const { householdOne, adminTwo, householdTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { delegateResponse, notificationRequestDelegateAdmin, isUserInHouseholdOne, isUserInHouseholdTwo, adminTwoAfterSwitch } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, "606dad080ac1c22766b37a55");

    expect(delegateResponse.statusCode).toBe(404);
    expect(JSON.parse(delegateResponse.error.text).isBoom).toBe(true);
    expect(JSON.parse(delegateResponse.error.text).output.payload.message).toMatch("Code utilisateur du/de la délégué.e non trouvé!");
    expect(notificationRequestDelegateAdmin).toBeNull();
    expect(isUserInHouseholdOne).toBeUndefined();
    expect(isUserInHouseholdTwo.userData.toString()).toBe(adminTwo._id.toString());
    expect(adminTwoAfterSwitch.role).toMatch("admin");
    expect(adminTwoAfterSwitch.householdId.toString()).toBe(householdTwo._id.toString());
  });
  it("Test 10) admin delegate admin rights with a good otherMember query", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { 
      delegateResponse, 
      notificationRequestDelegateAdmin, 
      householdTwoAfterSwitch,
      isUserInHouseholdOne, 
      isUserInHouseholdTwo, 
      adminTwoAfterSwitch 
    } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);

    expect(delegateResponse.statusCode).toBe(204);
    expect(notificationRequestDelegateAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(notificationRequestDelegateAdmin.householdId.toString()).toBe(householdTwo._id.toString());
    expect(notificationRequestDelegateAdmin.type).toMatch("request-delegate-admin");
    expect(isUserInHouseholdOne.userData.toString()).toBe(adminTwo._id.toString());
    expect(isUserInHouseholdTwo).toBeUndefined();
    expect(adminTwoAfterSwitch.role).toMatch("user");
    expect(adminTwoAfterSwitch.householdId.toString()).toBe(householdOne._id.toString());
    expect(householdTwoAfterSwitch.isWaiting).toBe(true);
  });
});