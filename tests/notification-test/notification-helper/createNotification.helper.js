const Notification = require('../../../api/models/notification.model');

module.exports.createNotification = async ({adminOne, userOne, adminTwo, userTwo}) => {
  let notificationObject = {};

  /*Notification for adminOne*/

  let newNotifNeedSwitchAdminReceivedAdminOne = new Notification({
    type: "need-switch-admin",
    message: `1) AdminOne need switch admin notification received`,
    userId: adminOne._id,
    householdId: adminTwo.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifNeedSwitchAdminReceivedAdminOne.save();

  let newNotifInviteUserToHouseholdReceivedAdminOne = new Notification({
    type : "invitation-user-to-household",
    senderUserId : userTwo._id,
    message : `2) AdminOne invitation use to household notification received`,
    householdId: adminOne.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifInviteUserToHouseholdReceivedAdminOne.save();

  let newNotificationInformationReceivedAdminOne = new Notification({
    message: `3) Message d'information pour adminOne notification received`,
    type: 'information',
    householdId: adminOne.householdId,
  });
  await newNotificationInformationReceivedAdminOne.save();


  let newNotifHouseholdToUserSendedAdminOne = new Notification({
    type: "invitation-household-to-user",
    message: `4) AdminOne invitation household to user notification sended`,
    userId: userTwo._id,
    householdId: adminOne.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifHouseholdToUserSendedAdminOne.save();

  let newNotifNeedSwitchAdminSendedAdminOne = new Notification({
    type: "invitation-household-to-user",
    message: `5) AdminOne invitation need switch admin notification sended`,
    userId: adminTwo._id,
    householdId: adminOne.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifNeedSwitchAdminSendedAdminOne.save();

  /*Notification for userOne*/

  let newNotifHouseholdToUserReceivedUserOne = new Notification({
    type: "invitation-household-to-user",
    message: `6) UserOne invitation household to user notification received`,
    userId: userOne._id,
    householdId: adminTwo.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifHouseholdToUserReceivedUserOne.save();

  let newNotifInviteUserToHouseholdSendedUserOne = new Notification({
    type : "invitation-user-to-household",
    senderUserId : userOne._id,
    message : `7) UserOne invitation user to household notification sended`,
    householdId: adminTwo.householdId,
    urlRequest: "add-user-respond",
  });
  await newNotifInviteUserToHouseholdSendedUserOne.save();

  let adminOneNotifObject = {
    notifReceived: [
      newNotifNeedSwitchAdminReceivedAdminOne,
      newNotifInviteUserToHouseholdReceivedAdminOne,
      newNotificationInformationReceivedAdminOne
    ],
    notifSended: [
      newNotifHouseholdToUserSendedAdminOne,
      newNotifNeedSwitchAdminSendedAdminOne
    ]
  };

  let userOneNotifObject = {
    notifReceived: [newNotifHouseholdToUserReceivedUserOne],
    notifSended: [newNotifInviteUserToHouseholdSendedUserOne]
  };

  notificationObject.adminOne = adminOneNotifObject;
  notificationObject.userOne = userOneNotifObject;

  return notificationObject;
};