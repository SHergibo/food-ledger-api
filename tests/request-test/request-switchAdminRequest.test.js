const Household = require('./../../api/models/household.model'),
      { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { createAddUserRespondTest, createAddUserRespondTestOneUser, acceptAddUserRequest, delegateWithOtherMember } = require('./request-helper/addUserRespond.helper'),
      { userAcceptDelegateAdmin, 
        userRejectDelegateAdminWithOtherMember, 
        userRejectDelegateAdminWithoutOtherMember, 
        testErrorUserRejectDelegateAdminWithoutOtherMember,
        createLastChanceDelegateAdminNotif,
        userAcceptLastChanceDelegateAdmin,
        userRejectLastChanceDelegateAdmin,
        lastUserRejectLastChanceDelegateAdmin } = require('./request-helper/switchAdminRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationAddUserRespond } = require('../test-data');

const { dbManagement } = require('../db-management-utils');
const { connectSocketClient, disconnectSocketClient } = require('../socket-io-management-utils');

dbManagement();

const URL_REQUEST = "delegate-admin";

describe("Test switchAdminRequest", () => {
  it("Test 1) send delegate admin request with a bad notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
    );
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Notification non trouvée!");
  });
  it("Test 2) send delegate admin request with a wrong notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationAddUserRespond
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Mauvaise notification!");
  });
  it("Test 3) send delegate admin request without acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Besoin d'un paramètre de requête!");
  });
  it("Test 4) send delegate admin request with a wrong acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin,
      '?acceptedRequest=oui'
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Paramètre de requête invalide!");
  });
  it("Test 5) send delegate admin request with a wrong otherMember query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin,
      '?acceptedRequest=yes&otherMember=606dad080ac1c22766b37a53'
    );
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Code utilisateur du/de la délégué.e non trouvé!");
  });
  it("Test 6) userTwo accept notificationRequestDelegateAdmin with transformed invitation notification", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, objectClientSocket } = await createAddUserRespondTest({withSocket : true});
    connectSocketClient(objectClientSocket);

    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    
    let deleteNotifReceivedFromTransformNotif;
    objectClientSocket.clientSocketUserTwo.on("deleteNotificationReceived", (data) => {
      deleteNotifReceivedFromTransformNotif = data;
    });

    let updateNotifReceivedFromTransformNotif;
    objectClientSocket.clientSocketUserTwo.on("updateNotificationReceived", (data) => {
      updateNotifReceivedFromTransformNotif = data;
    });
    
    let updateNotifUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateNotifArray", (data) => {
      updateNotifUserTwo = data;
    });

    let updateAllNotifReceivedUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateAllNotificationsReceived", (data) => {
      updateAllNotifReceivedUserTwo = data;
    });

    let updateUserAndFamillyUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyUserTwo = data;
    });

    let updateFamillyNotifUserThree;
    objectClientSocket.clientSocketUserThree.on("updateFamilly", (data) => {
      updateFamillyNotifUserThree = data;
    });

    let updateNotifSendedAdminOne;
    objectClientSocket.clientSocketAdminOne.on("updateNotifArray", (data) => {
      updateNotifSendedAdminOne = data;
    });
    
    const { 
      acceptNotification, 
      deletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      checkInviteNotification,
      inviteNotificationId,
      tranformedNotification
    } = await userAcceptDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne});

    expect(deleteNotifReceivedFromTransformNotif).toBe(inviteNotificationId);
    expect(updateNotifReceivedFromTransformNotif._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateNotifReceivedFromTransformNotif.type).toBe(tranformedNotification.type);

    expect(updateNotifUserTwo.arrayData[0]._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateNotifUserTwo.arrayData[0].type).toBe(tranformedNotification.type);
    expect(updateNotifUserTwo.totalNotifReceived).toBe(1);

    expect(updateAllNotifReceivedUserTwo[0]._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateAllNotifReceivedUserTwo[0].message).toBe(tranformedNotification.message);
    expect(updateAllNotifReceivedUserTwo[0].type).toBe(tranformedNotification.type);

    expect(updateUserAndFamillyUserTwo.userData.role).toBe("admin");
    expect(updateUserAndFamillyUserTwo.userData.householdId.toString()).toBe(householdTwoAfterNewAdmin._id.toString());
    expect(updateUserAndFamillyUserTwo.householdData.isWaiting).toBe(false);
    expect(updateUserAndFamillyUserTwo.householdData.userId.toString()).toBe(userTwo._id.toString());
    
    expect(updateFamillyNotifUserThree.isWaiting).toBe(false);
    expect(updateFamillyNotifUserThree.userId.toString()).toBe(userTwo._id.toString());

    expect(updateNotifSendedAdminOne.arrayData[0]._id.toString()).toBe(tranformedNotification._id.toString());
    expect(updateNotifSendedAdminOne.arrayData[0].message).toBe(tranformedNotification.message);
    expect(updateNotifSendedAdminOne.arrayData[0].type).toBe(tranformedNotification.type);
    expect(updateNotifSendedAdminOne.totalNotifSended).toBe(1);
    
    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(deletedNotification).toBeNull();
    expect(checkInviteNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userTwo._id.toString());

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 7) userTwo accept notificationRequestDelegateAdmin without transformed invitation notification", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, objectClientSocket } = await createAddUserRespondTestOneUser({withSocket : true});
    connectSocketClient(objectClientSocket);

    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    
    let updateAllNotifReceivedUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateAllNotificationsReceived", (data) => {
      updateAllNotifReceivedUserTwo = data;
    });

    let updateUserAndFamillyUserTwo;
    objectClientSocket.clientSocketUserTwo.on("updateUserAndFamillyData", (data) => {
      updateUserAndFamillyUserTwo = data;
    });

    const { 
      acceptNotification, 
      deletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      checkInviteNotification, 
      tranformedNotification
    } = await userAcceptDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne});

    expect(updateAllNotifReceivedUserTwo[0]._id.toString()).toBe(checkInviteNotification._id.toString());
    expect(updateAllNotifReceivedUserTwo[0].message).toBe(checkInviteNotification.message);
    expect(updateAllNotifReceivedUserTwo[0].type).toBe(checkInviteNotification.type);
    
    expect(updateUserAndFamillyUserTwo.userData.role).toBe("admin");
    expect(updateUserAndFamillyUserTwo.userData.householdId.toString()).toBe(householdTwoAfterNewAdmin._id.toString());
    expect(updateUserAndFamillyUserTwo.householdData.isWaiting).toBe(false);
    expect(updateUserAndFamillyUserTwo.householdData.userId.toString()).toBe(userTwo._id.toString());
    
    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(deletedNotification).toBeNull();
    expect(checkInviteNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();

    disconnectSocketClient(objectClientSocket);
  });
  it("Test 8) userTwo refuse notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      rejectNotification, 
      deletedNotification, 
      userThreeNotification, 
      userTwoIsFlagged,
      checkInviteNotification, 
      tranformedNotification
    } = await userRejectDelegateAdminWithOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo, userThree});

    expect(rejectNotification.statusCode).toBe(204);
    expect(userTwoIsFlagged.isFlagged).toBe(true);
    expect(deletedNotification).toBeNull();
    expect(userThreeNotification.userId.toString()).toBe(userThree._id.toString());
    expect(checkInviteNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
  });
  it("Test 9) userTwo refuse notificationRequestDelegateAdmin without otherMember query", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      rejectNotification, 
      checkNotificationExist,
      checkInviteNotification, 
      tranformedNotification
    } = await testErrorUserRejectDelegateAdminWithoutOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne});

    expect(rejectNotification.statusCode).toBe(400);
    expect(JSON.parse(rejectNotification.error.text).output.payload.message).toMatch("Un.e ou plusieurs autres membres sont encore éligibles pour la délégation des droits d'administrations!");
    expect(checkNotificationExist.userId.toString()).toBe(userTwo._id.toString());
    expect(checkInviteNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
  });
  it("Test 10) userThree accept notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { userThreeNotification } = await userRejectDelegateAdminWithOtherMember({ userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo, userThree });
    const { 
      acceptNotification, 
      deletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      checkInviteNotification, 
      tranformedNotification 
    } = await userAcceptDelegateAdmin({ userdata: userThree, username: "userThree", notificationId : userThreeNotification._id, householdOne });

    const userTwoIsFlagged = householdTwoAfterNewAdmin.members.find(member => member.userData.toString() === userTwo._id.toString());
    const checkHouseholdThree = await Household.findById(householdThree._id);

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userThree._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(deletedNotification).toBeNull();
    expect(checkInviteNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userThree._id.toString());
    expect(userTwoIsFlagged.isFlagged).toBe(false);
    expect(checkHouseholdThree).toBeNull();
  });
  it("Test 11) userThree refuse notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      userThreeNotification,
      checkInviteNotification, 
      tranformedNotification  
    } = await userRejectDelegateAdminWithOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo, userThree});
    const { 
      rejectNotification, 
      deletedNotification, 
      checkHouseholdTwo, 
      checkUserTwo, 
      checkHouseholdThree, 
      checkUserThree,
      checkInviteNotificationUserThree,
      tranformedNotificationUserThree
    } = await userRejectDelegateAdminWithoutOtherMember({userdata: userThree, username: "userThree", notificationId : userThreeNotification._id, householdOne, householdTwo, userTwo, householdThree});
    
    expect(rejectNotification.statusCode).toBe(204);
    expect(deletedNotification).toBeNull();
    expect(checkHouseholdTwo).toBeNull();
    expect(checkUserTwo.householdId).toBeNull();
    expect(checkHouseholdThree.userId.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].userData.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].isFlagged).toBe(false);
    expect(checkUserThree.householdId.toString()).toBe(householdThree._id.toString());
    expect(checkUserThree.role).toMatch("admin");
    expect(checkInviteNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
    expect(checkInviteNotificationUserThree.userId.toString()).toBe(userThree._id.toString());
    expect(tranformedNotificationUserThree).toBeNull();
  });
  it("Test 12) userTwo accept last chance request delegate admin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const notifications = await createLastChanceDelegateAdminNotif([
      {username : "userTwo", userId: userTwo._id},
      {username : "userThree", userId: userThree._id},
    ], householdTwo);

    const { 
      acceptNotification, 
      allNotifDeleted, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo, 
      checkInviteNotification, 
      tranformedNotification
    } = await userAcceptLastChanceDelegateAdmin({userdata: userTwo, username: "userTwo", notifications, householdOne});

    expect(acceptNotification.statusCode).toBe(204);
    expect(allNotifDeleted).toBe(true);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.lastChance).toBeUndefined();
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(checkInviteNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userTwo._id.toString());
  });
  it("Test 13) userTwo reject last chance request delegate admin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const notifications = await createLastChanceDelegateAdminNotif([
      {username : "userTwo", userId: userTwo._id},
      {username : "userThree", userId: userThree._id},
    ], householdTwo);

    const { 
      rejectNotification, 
      deletedNotification, 
      checkNumberLastChanceNotif, 
      checkInviteNotification, 
      tranformedNotification
    } = await userRejectLastChanceDelegateAdmin({userdata: userTwo, username: "userTwo", notifications, householdOne, householdTwo});
    
    expect(rejectNotification.statusCode).toBe(204);
    expect(deletedNotification).toBeNull();
    expect(checkNumberLastChanceNotif).toBe(true);
    expect(checkInviteNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
  });
  it("Test 14) userThree reject last chance request delegate admin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const notifications = await createLastChanceDelegateAdminNotif([
      {username : "userTwo", userId: userTwo._id},
      {username : "userThree", userId: userThree._id},
    ], householdTwo);
    await userRejectLastChanceDelegateAdmin({userdata: userTwo, username: "userTwo", notifications, householdOne, householdTwo});

    const { 
      rejectNotification, 
      deletedNotification, 
      checkNumberLastChanceNotif, 
      checkHouseholdTwo, 
      checkUserTwo, 
      checkHouseholdThree, 
      checkUserThree, 
      checkInviteNotification, 
      tranformedNotification
    } = await lastUserRejectLastChanceDelegateAdmin({userdata: userThree, username: "userThree", notifications, householdOne, householdTwo, userTwo, householdThree});
    
    expect(rejectNotification.statusCode).toBe(204);
    expect(deletedNotification).toBeNull();
    expect(checkNumberLastChanceNotif).toBe(true);
    expect(checkHouseholdTwo).toBeNull();
    expect(checkUserTwo.householdId).toBeNull();
    expect(checkHouseholdThree.userId.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].userData.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].isFlagged).toBe(false);
    expect(checkUserThree.householdId.toString()).toBe(householdThree._id.toString());
    expect(checkUserThree.role).toMatch("admin");
    expect(checkInviteNotification.userId.toString()).toBe(userThree._id.toString());
    expect(tranformedNotification).toBeNull();
  });
});