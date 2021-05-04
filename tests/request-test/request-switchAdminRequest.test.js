const Household = require('./../../api/models/household.model'),
      { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { createAddUserRespondTest, createAddUserRespondTestOneUser, acceptAddUserRequest, delegateWithOtherMember } = require('./request-helper/addUserRespond.helper'),
      { userAcceptDelegateAdmin, 
        userRejectDelegateAdminWithOtherMember, 
        userRejectDelegateAdminWithoutOtherMember, 
        testErrorUserRejectDelegateAdminWithoutOtherMember,
        createLastChanceDelegateAdminNotif,
        userAcceptLastChanceDelegateAdmin } = require('./request-helper/switchAdminRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationAddUserRespond } = require('../test-data');

const { dbManagement } = require('../db-management-utils');
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
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      acceptNotification, 
      DeletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      invitationNotification, 
      tranformedNotification
    } = await userAcceptDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo})

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
    expect(invitationNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userTwo._id.toString());
  });
  it("Test 7) userTwo accept notificationRequestDelegateAdmin without transformed invitation notification", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTestOneUser();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      acceptNotification, 
      DeletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      invitationNotification, 
      tranformedNotification
    } = await userAcceptDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo});

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
    expect(invitationNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
  });
  it("Test 8) userTwo refuse notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      rejectNotification, 
      DeletedNotification, 
      userThreeNotification, 
      userTwoIsFlagged
    } = await userRejectDelegateAdminWithOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdTwo, userThree});

    expect(rejectNotification.statusCode).toBe(204);
    expect(userTwoIsFlagged.isFlagged).toBe(true);
    expect(DeletedNotification).toBeNull();
    expect(userThreeNotification.userId.toString()).toBe(userThree._id.toString());
  });
  it("Test 9) userTwo refuse notificationRequestDelegateAdmin without otherMember query", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      rejectNotification, 
      checkNotification
    } = await testErrorUserRejectDelegateAdminWithoutOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id});

    expect(rejectNotification.statusCode).toBe(400);
    expect(JSON.parse(rejectNotification.error.text).output.payload.message).toMatch("Un.e ou plusieurs autres membres sont encore éligibles pour la délégation des droits d'administrations!");
    expect(checkNotification.userId.toString()).toBe(userTwo._id.toString());
  });
  it("Test 10) userThree accept notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { userThreeNotification } = await userRejectDelegateAdminWithOtherMember({ userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo,userThree });
    const { 
      acceptNotification, 
      DeletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo,
      invitationNotification, 
      tranformedNotification 
    } = await userAcceptDelegateAdmin({ userdata: userThree, username: "userThree", notificationId : userThreeNotification._id, householdOne, householdTwo });

    const userTwoIsFlagged = householdTwoAfterNewAdmin.members.find(member => member.userData.toString() === userTwo._id.toString());
    const checkHouseholdThree = await Household.findById(householdThree._id);

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userThree._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
    expect(invitationNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userThree._id.toString());
    expect(userTwoIsFlagged.isFlagged).toBe(false);
    expect(checkHouseholdThree).toBeNull();
  });
  it("Test 11) userThree refuse notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree, householdThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { userThreeNotification } = await userRejectDelegateAdminWithOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdTwo, userThree});
    const { 
      rejectNotification, 
      DeletedNotification, 
      checkHouseholdTwo, 
      checkUserTwo, 
      checkHouseholdThree, 
      checkUserThree
    } = await userRejectDelegateAdminWithoutOtherMember({userdata: userThree, username: "userThree", notificationId : userThreeNotification._id, householdTwo, userTwo, householdThree});
    
    expect(rejectNotification.statusCode).toBe(204);
    expect(DeletedNotification).toBeNull();
    expect(checkHouseholdTwo).toBeNull();
    expect(checkUserTwo.householdId).toBeNull();
    expect(checkHouseholdThree.userId.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].userData.toString()).toBe(userThree._id.toString());
    expect(checkHouseholdThree.members[0].isFlagged).toBe(false);
    expect(checkUserThree.householdId.toString()).toBe(householdThree._id.toString());
    expect(checkUserThree.role).toMatch("admin");
  });
  it("Test 12) userTwo accept last chance request delegate admin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo, userThree } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    await userRejectDelegateAdminWithOtherMember({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdTwo, userThree});
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
      invitationNotification, 
      tranformedNotification
    } = await userAcceptLastChanceDelegateAdmin({userdata: userTwo, username: "userTwo", notifications, householdOne, householdTwo});
    
    expect(acceptNotification.statusCode).toBe(204);
    expect(allNotifDeleted).toBe(true);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.lastChance).toBeUndefined();
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(invitationNotification).toBeNull();
    expect(tranformedNotification.userId.toString()).toBe(userTwo._id.toString());
  });
});

//OK 2.2) user 2 accepte la requête
  // OK => check famille isWaiting false
  // OK => check userId === user._id dans household
  // OK => check user role admin
  // OK => check notif delete
  // => check si la transformation d'une notification d'invitation a était transformé en need-switch-admin (si il y a deux membres dans la famille)
  //OK 2.2.1) 
  // OK => check si la transformation d'une notification d'invitation n'a pas était transformé en need-switch-admin (si il y a un seul membre dans la famille)
// OK 2.3) user 2 n'accepte pas la requête, delégue les droit à user 3
  // OK => check ancienne notif delete 
  // OK => check nouvelle notif créée pour user 3
  // OK => check user 2 isFlagged true dans le tableau des membres 
  //OK 2.3.1) user 3 accepte
    // OK => check famille isWaiting false
    // OK => check userId === user._id dans household
    // OK => check user role admin
    // OK => check notif delete
    // OK => check position du nouvel admin en 0 dans members array
    // OK => check si user 2 isFlagged is false dans le tableau des membres
    // OK => check si ancienne famille user 3 est delete
  //OK 2.3.2) user 3 n'accepte pas
    // OK => check famille est delete
    // OK => check si le user 2 a household id en null
    // OK => check si notif est delete
    // OK => check si user3 retourne dans son ancienne famille (role admin, householdId et array members).
  // OK 2.3.3) user 2 refuse sans envoyer de otherMember id dans req.params
    // OK => check error status
    // OK => check error message
//OK 3) Admin2 ne delégue pas ses droits  => tester neMoreAdmin helper (avec et sans erreur)
    // OK => check famille est delete
    // OK => check si le user 2 a household id en null
    // OK => check si notif est delete
    // OK => check si user3 retourne dans son ancienne famille (role admin, householdId et array members).
// 4) OK => Créer deux notif type last-chance-request-delegate-admin
  // 4.1) user 2 accepte
      // OK => vérifier si les deux notif last chance sont delete pour user 2 et 3
      // OK => vérifier si lastChance field de la famille est unset
  // 4.2) user 2 n'accepte pas
      // => test si notif de user est delete
  // 4.3) user 3 n'accepte pas
      // => test si notif de user est delete
      // => test si famille est delete
      // => test si user 3 revient dans son ancienne famille
      // => test si user 2 a householdId en null