const { createAddUserRespondTest, acceptAddUserRequest, delegateWithOtherMember } = require('./addUserRespond.helper');
const { userAcceptNotificationRequestDelegateAdmin } = require('./switchAdminRequest.helper');

const { dbManagement } = require('./db-management-utils');
dbManagement();

describe("Test addUserRespond", () => {
  it("User accept notificationRequestDelegateAdmin", async () => {
    const { householdOne, adminTwo, householdTwo, userTwo } = await createAddUserRespondTest();
    const { notificationDelegateUser } = await acceptAddUserRequest(adminTwo, householdOne);
    const { notificationRequestDelegateAdmin } = await delegateWithOtherMember(adminTwo, householdOne, householdTwo, notificationDelegateUser._id, userTwo._id);
    const { 
      acceptNotification, 
      DeletedNotification, 
      householdTwoAfterNewAdmin, 
      newAdminIndex, 
      newAdminTwo 
    } = await userAcceptNotificationRequestDelegateAdmin(userTwo, notificationRequestDelegateAdmin._id, householdTwo)

    expect(acceptNotification.statusCode).toBe(204);
    expect(householdTwoAfterNewAdmin.isWaiting).toBe(false);
    expect(householdTwoAfterNewAdmin.userId.toString()).toBe(userTwo._id.toString());
    expect(newAdminIndex).toBe(0);
    expect(newAdminTwo.role).toMatch("admin");
    expect(DeletedNotification).toBeNull();
  });
});

//OK 2.2) user 2 accepte la requête
  // OK => check famille isWaiting false
  // OK => check userId === user._id dans household
  // OK => check user role admin
  // OK => check notif delete
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