const { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { createAddUserRespondTest, createAddUserRespondTestOneUser, acceptAddUserRequest, delegateWithOtherMember } = require('./request-helper/addUserRespond.helper'),
      { userAcceptNotificationRequestDelegateAdmin } = require('./request-helper/switchAdminRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationAddUserRespond } = require('../test-data');

const { dbManagement } = require('../db-management-utils');
dbManagement();

const URL_REQUEST = "delegate-admin";

describe("Test addUserRespond", () => {
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
    } = await userAcceptNotificationRequestDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo})

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
    } = await userAcceptNotificationRequestDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo})

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
    expect(invitationNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
  });
  it("Test 8) userTwo don't accept notificationRequestDelegateAdmin", async () => {
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
    } = await userAcceptNotificationRequestDelegateAdmin({userdata: userTwo, username: "userTwo", notificationId : notificationRequestDelegateAdmin._id, householdOne, householdTwo})

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
    expect(invitationNotification.userId.toString()).toBe(userTwo._id.toString());
    expect(tranformedNotification).toBeNull();
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
// 2.3) user 2 n'accepte pas la requête, delégue les droit à user 3
  // => check ancienne notif delete 
  // => check nouvelle notif créée pour user 3
  // => check user 2 isFlagged true dans le tableau des membres 
  // 2.3.1) user 3 accepte
    // => check famille isWaiting false
    // => check userId === user._id dans household
    // => check user role admin
    // => check notif delete
    // => check position du nouvel admin en 0 dans members array
    // => check si user 2 isFlagged is false dans le tableau des membres
    // => check si ancienne famille user 3 est delete
  // 2.3.2) user 3 n'accepte pas
    // => check famille est delete
    // => check si le user 3 a household id en null
    // => check si notif est delete
    // => check si user2 retourne dans son ancienne famille (role admin, householdId et array members).
// 3) Admin2 ne delégue pas ses droits  => tester neMoreAdmin helper (avec et sans erreur)
    // => check famille est delete
    // => check si le user 3 a household id en null
    // => check si notif est delete
    // => check si user2 retourne dans son ancienne famille (role admin, householdId et array members).
// 4) Créer deux notif type last-chance-request-delegate-admin
  // 4.1) user 2 accepte
      // => vérifier si les deux notif last chance sont delete pour user 2 et 3
      // => vérifier si lastChance field de la famille est unset
  // 4.2) user 2 n'accepte pas
      // => test si notif de user est delete
  // 4.3) user 3 n'accepte pas
      // => test si notif de user est delete
      // => test si famille est delete
      // => test si user 3 revient dans son ancienne famille
      // => test si user 2 a householdId en null