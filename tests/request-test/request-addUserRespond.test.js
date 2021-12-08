const request = require("supertest"),
      app = require("./../../config/app.config"),
      { api } = require('./../../config/environment.config'),
      Household = require('./../../api/models/household.model'),
      Notification = require('./../../api/models/notification.model'),
      User = require('./../../api/models/user.model'),
      { login } = require('../login.helper'),
      { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { createAddUserRequestTestOne } = require('./request-helper/addUserRequest.helper'),
      { createAddUserRespondTest, createAddUserRespondTestOneUser, acceptAddUserRequest, delegateWithOtherMember, delegateWithoutOtherMember, testTranformInviteNotif } = require('./request-helper/addUserRespond.helper'),
      { adminOneDataComplete, adminTwoDataComplete, notificationDelegateAdmin, notificationAddUserRespond} = require('../test-data'),
      Client = require("socket.io-client");

const { dbManagement } = require('../db-management-utils');
const { connectSocketClient, disconnectSocketClient } = require('../socket-io-management-utils');

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
    let clientSocketAdminOne = Client(`http://localhost:8003`);
    let clientSocketAdminTwo = Client(`http://localhost:8003`);
    let objectClientSocket = {clientSocketAdminOne, clientSocketAdminTwo};

    connectSocketClient(objectClientSocket);

    let notifReceivedAdminOne;
    clientSocketAdminOne.on("updateNotificationReceived", (data) => {
      notifReceivedAdminOne = data;
    });

    let updateNotifAdminOne;
    clientSocketAdminOne.on("updateNotifArray", (data) => {
      updateNotifAdminOne = data;
    });

    let deleteNotifAdminTwo;
    clientSocketAdminTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminTwo = data;
    });

    const { admin, user, householdAdmin, notificationAddUser } = await createAddUserRequestTestOne(adminOneDataComplete, adminTwoDataComplete, objectClientSocket);

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

    expect(notifReceivedAdminOne.message).toBe(`L'utilisateur.trice ${user.firstname} ${user.lastname} n'a pas accepté.e votre requête d'invitation!`);
    expect(notifReceivedAdminOne.type).toBe('information');
    expect(updateNotifAdminOne.arrayData[0]._id.toString()).toBe(notifReceivedAdminOne._id.toString());
    expect(deleteNotifAdminTwo.toString()).toBe(notificationAddUser._id.toString());

    expect(rejectAddUserRequest.statusCode).toBe(204);
    expect(notificationAddUserDeleted).toBeNull();

    expect(notificationInformation.householdId.toString()).toBe(admin.householdId.toString());
    expect(notificationInformation.type).toMatch("information");

    expect(user.householdId.toString()).toBe(householdUser._id.toString());
    expect(user._id.toString()).toBe(householdUser.userId.toString());

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 7) send addUser request from admin to user and the user accept the offer", async () => {
    let clientSocketAdminOne = Client(`http://localhost:8003`);
    let clientSocketAdminTwo = Client(`http://localhost:8003`);
    let objectClientSocket = {clientSocketAdminOne, clientSocketAdminTwo};

    connectSocketClient(objectClientSocket);

    let updateUserAndFamillyAdminTwo;
    clientSocketAdminTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyAdminTwo = data;
    });

    let updateAllNotifReceivedAdminTwo;
    clientSocketAdminTwo.on("updateAllNotificationsReceived", (data) => {
      updateAllNotifReceivedAdminTwo = data;
    });

    let deleteNotifAdminTwo;
    clientSocketAdminTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminTwo = data;
    });

    const { user, householdAdmin, notificationAddUser } = await createAddUserRequestTestOne(adminOneDataComplete, adminTwoDataComplete, objectClientSocket);

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

    expect(updateUserAndFamillyAdminTwo.userData.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(updateUserAndFamillyAdminTwo.householdData.householdCode).toBe(householdAdmin.householdCode);
    expect(updateAllNotifReceivedAdminTwo).toEqual([]);
    expect(deleteNotifAdminTwo.toString()).toBe(notificationAddUser._id.toString());

    expect(acceptAddUserRequest.statusCode).toBe(204);
    expect(notificationAddUserDeleted).toBeNull();

    expect(householdUser.members.length).toBe(0);
    expect(userAfterSwitchFamilly.householdId.toString()).toBe(householdAdmin._id.toString());
    expect(userAfterSwitchFamilly.role).toMatch("user");
    expect(indexUserInHouseholdAdminMemberArray).toBe(1);

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 8) create delegate Notification and check if that notification is created", async () => {
    const { householdOne, adminTwo, objectClientSocket } = await createAddUserRespondTest({withSocket: true});
    connectSocketClient(objectClientSocket);
    
    let notifReceivedAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("updateNotificationReceived", (data) => {
      notifReceivedAdminTwo = data;
    });

    let updateNotifAdminTwo = {};
    objectClientSocket.clientSocketAdminTwo.on("updateNotifArray", (data) => {
      if(Object.keys(data).find(key => key === 'totalNotifSended')) updateNotifAdminTwo['updateSendedNotif'] = data;
      if(Object.keys(data).find(key => key === 'totalNotifReceived')) updateNotifAdminTwo['updateReceivedNotif'] = data;
    });

    let deleteNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminOne = data;
    });

    const { addUserNotification, addUserRequestResponse, notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);

    expect(notifReceivedAdminTwo._id.toString()).toBe(notificationDelegateUser._id.toString());
    expect(notifReceivedAdminTwo.type).toBe(notificationDelegateUser.type);
    expect(updateNotifAdminTwo.updateSendedNotif.arrayData).toEqual([]);
    expect(updateNotifAdminTwo.updateSendedNotif.totalNotifSended).toBe(0);
    expect(updateNotifAdminTwo.updateReceivedNotif.arrayData[0]._id.toString()).toBe(notificationDelegateUser._id.toString());
    expect(updateNotifAdminTwo.updateReceivedNotif.arrayData[0].type).toBe(notificationDelegateUser.type);
    expect(updateNotifAdminTwo.updateReceivedNotif.totalNotifReceived).toBe(1);
    expect(deleteNotifAdminOne.toString()).toBe(addUserNotification._id.toString());

    expect(addUserRequestResponse.statusCode).toBe(204);
    expect(notificationDelegateUser.userId.toString()).toBe(adminTwo._id.toString());
    expect(notificationDelegateUser.householdId.toString()).toBe(householdOne._id.toString());
    expect(notificationDelegateUser.type).toMatch("need-switch-admin");

    disconnectSocketClient(objectClientSocket);
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
    const { householdOne, adminTwo, householdTwo, userTwo, objectClientSocket } = await createAddUserRespondTest({withSocket: true});
    connectSocketClient(objectClientSocket);

    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);

    let notifReceivedUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateNotificationReceived", (data) => {
      notifReceivedUserTwo = data;
    });

    let updateNotifUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateNotifArray", (data) => {
      updateNotifUserTwo = data;
    });

    let updateFamillyUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateFamilly", (data) => {
      updateFamillyUserTwo = data;
    });

    let updateFamillyUserThree;
    objectClientSocket.clientSocketUserThree.on("updateFamilly", (data) => {
      updateFamillyUserThree = data;
    });

    let updateUserAndFamillyAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyAdminTwo = data;
    });

    let deleteNotifAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminTwo = data;
    });

    let updateFamillyNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateFamilly", (data) => {
      updateFamillyNotifAdminOne = data;
    });

    const { 
      delegateResponse, 
      notificationRequestDelegateAdmin, 
      householdTwoAfterSwitch,
      isUserInHouseholdOne, 
      isUserInHouseholdTwo, 
      adminTwoAfterSwitch 
    } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);

    expect(notifReceivedUserTwo._id.toString()).toBe(notificationRequestDelegateAdmin._id.toString());
    expect(notifReceivedUserTwo.type).toMatch("request-delegate-admin");
    expect(updateNotifUserTwo.arrayData[0]._id.toString()).toBe(notificationRequestDelegateAdmin._id.toString());
    expect(updateNotifUserTwo.arrayData[0].type).toMatch("request-delegate-admin");
    expect(updateNotifUserTwo.totalNotifReceived).toBe(1);
    expect(updateFamillyUserTwo.isWaiting).toBe(true);
    expect(updateFamillyUserThree.isWaiting).toBe(true);

    expect(updateUserAndFamillyAdminTwo.householdData._id.toString()).toBe(householdOne._id.toString());
    expect(updateUserAndFamillyAdminTwo.userData.householdId.toString()).toBe(householdOne._id.toString());
    expect(updateUserAndFamillyAdminTwo.userData.role).toBe('user');
    expect(deleteNotifAdminTwo.toString()).toBe(notificationDelegateUser._id.toString());

    expect(updateFamillyNotifAdminOne.members[1].userData._id.toString()).toBe(adminTwo._id.toString());


    expect(delegateResponse.statusCode).toBe(204);
    expect(notificationRequestDelegateAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(notificationRequestDelegateAdmin.householdId.toString()).toBe(householdTwo._id.toString());
    expect(notificationRequestDelegateAdmin.type).toMatch("request-delegate-admin");
    expect(isUserInHouseholdOne.userData.toString()).toBe(adminTwo._id.toString());
    expect(isUserInHouseholdTwo).toBeUndefined();
    expect(adminTwoAfterSwitch.role).toMatch("user");
    expect(adminTwoAfterSwitch.householdId.toString()).toBe(householdOne._id.toString());
    expect(householdTwoAfterSwitch.isWaiting).toBe(true);

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 11) admin switch household without otherMember query params", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree, objectClientSocket } = await createAddUserRespondTest(true);
    connectSocketClient(objectClientSocket);

    let updateUserAndFamillyAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyAdminTwo = data;
    });

    let deleteNotifAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminTwo = data;
    });

    let updateFamillyNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateFamilly", (data) => {
      updateFamillyNotifAdminOne = data;
    });

    let updateUserAndFamillyUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyUserTwo = data;
    });
    
    let updateUserAndFamillyUserThree;
    objectClientSocket.clientSocketUserThree.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyUserThree = data;
    });

    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { 
      delegateResponse, 
      notificationDeleted, 
      isAdminTwoInHouseholdOne, 
      adminTwoAfterSwitch,
      householdTwoAfterSwitch, 
      userTwoAfterSwitch,
      userThreeAfterSwitch,
      isUserThreeInHouseholdOne
    } = await delegateWithoutOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo, userThree, householdThree);

    expect(updateUserAndFamillyAdminTwo.householdData._id.toString()).toBe(householdOne._id.toString());
    expect(updateUserAndFamillyAdminTwo.userData.householdId.toString()).toBe(householdOne._id.toString());
    expect(updateUserAndFamillyAdminTwo.userData.role).toBe('user');
    expect(deleteNotifAdminTwo.toString()).toBe(notificationDelegateUser._id.toString());

    expect(updateFamillyNotifAdminOne.members[1].userData._id.toString()).toBe(adminTwo._id.toString());

    expect(updateUserAndFamillyUserTwo.userData.householdId).toBeNull();
    expect(updateUserAndFamillyUserTwo.householdData).toBeUndefined();

    expect(updateUserAndFamillyUserThree.userData.householdId.toString()).toBe(householdThree._id.toString());
    expect(updateUserAndFamillyUserThree.householdData._id.toString()).toBe(householdThree._id.toString());

    expect(delegateResponse.statusCode).toBe(204);
    expect(notificationDeleted).toBeNull();
    expect(isAdminTwoInHouseholdOne.userData.toString()).toBe(adminTwo._id.toString());
    expect(adminTwoAfterSwitch.role).toMatch("user");
    expect(adminTwoAfterSwitch.householdId.toString()).toBe(householdOne._id.toString());
    expect(householdTwoAfterSwitch).toBeNull();
    expect(userTwoAfterSwitch.householdId).toBeNull();
    expect(userThreeAfterSwitch.householdId.toString()).toBe(householdThree._id.toString());
    expect(userThreeAfterSwitch.role).toMatch("admin");
    expect(isUserThreeInHouseholdOne.userData.toString()).toBe(userThree._id.toString());

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 12) Test if invitation notification is transforming into need switch admin notification", async () => {
    const { adminOne, householdOne, householdTwo, userTwo, objectClientSocket } = await createAddUserRespondTestOneUser(true);
    connectSocketClient(objectClientSocket);

    let updateNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateNotifArray", (data) => {
      updateNotifAdminOne = data;
    });

    let deleteNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("deleteNotificationReceived", (data) => {
      deleteNotifAdminOne = data;
    });
    
    let updateFamillyNotifAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateFamilly", (data) => {
      updateFamillyNotifAdminOne = data;
    });

    let updateNotifAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("updateNotifArray", (data) => {
      updateNotifAdminTwo = data;
    });

    let updateFamillyNotifAdminTwo;
    objectClientSocket.clientSocketAdminTwo.on("updateFamilly", (data) => {
      updateFamillyNotifAdminTwo = data;
    });
    
    let updateUserAndFamillyUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyUserTwo = data;
    });

    let updateNotifUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateNotifArray", (data) => {
      updateNotifUserTwo = data;
    });

    const { 
      delegateResponse,
      notificationDeleted, 
      addUserNotificationId,
      inviteNotifDeleted, 
      tranformedNotification,  
    } = await testTranformInviteNotif(adminOne, householdOne, userTwo, householdTwo);

    expect(updateNotifAdminOne.arrayData[0]._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateNotifAdminOne.totalNotifReceived).toBe(1);
    expect(deleteNotifAdminOne).toBe(addUserNotificationId);
    expect(updateFamillyNotifAdminOne.members[1].userData._id.toString()).toBe(userTwo._id.toString());

    expect(updateNotifAdminTwo.arrayData[0]._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateNotifAdminTwo.totalNotifSended).toBe(1);
    expect(updateFamillyNotifAdminTwo.members.length).toBe(1);

    expect(updateUserAndFamillyUserTwo.userData.householdId.toString()).toBe(householdOne._id.toString());
    expect(updateUserAndFamillyUserTwo.householdData._id.toString()).toBe(householdOne._id.toString());
    expect(updateNotifUserTwo.arrayData).toEqual([]);
    expect(updateNotifUserTwo.totalNotifSended).toBe(0);

    expect(delegateResponse.statusCode).toBe(204);
    expect(notificationDeleted).toBeNull();
    expect(inviteNotifDeleted).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(adminOne._id.toString());
    expect(tranformedNotification.type).toMatch("need-switch-admin");

    disconnectSocketClient(objectClientSocket);
  });
});