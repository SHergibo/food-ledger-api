const Household = require('./../models/household.model'),
      Notification = require('./../models/notification.model');

const injectHouseholdNameNotification = (notification) => {
  let message = notification.message;
  message = message.replace('{householdName}', notification.householdId.householdName);
  notification.message = message;
  return notification;
};

const transformNotification = async (userId, type, SocketIoHelper) => {
  let notifData = {};
  const searchedNotification = await Notification.find({userId : userId, type: type});
  if(searchedNotification.length >= 1){
    for (const notif of searchedNotification) {

      notifData = {
        "invitation-household-to-user" :  {
          message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`,
          householdId: notif.householdId,
          userId: notif.userId,
          type: "need-switch-admin",
          urlRequest: "add-user-respond",
        },
        "need-switch-admin" : {
          message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
          householdId: notif.householdId,
          userId: notif.userId,
          type: "invitation-household-to-user",
          urlRequest: "add-user-respond",
        }
      };

      let newTranformedNotif = await new Notification(notifData[type]);
      await newTranformedNotif.save(); 

      newTranformedNotif = await Notification.findById(newTranformedNotif._id)
      .populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      await Notification.findByIdAndDelete(notif._id);
      await SocketIoHelper.sendNotifToSocket({userId : notif.userId, notificationId : newTranformedNotif._id, type : "received", addedNotif: true});

      SocketIoHelper.socketIoEmit(notif.userId, 
        [
          {name : "deleteNotificationReceived", data: notif._id},
          {name : "updateNotificationReceived", data: injectHouseholdNameNotification(newTranformedNotif.transform({withHouseholdId: true}))},
        ]
      );

      const otherHousehold = await Household.findById(notif.householdId);

      await SocketIoHelper.sendNotifToSocket({userId : otherHousehold.userId, notificationId : newTranformedNotif._id, type : "sended", addedNotif: true});
    }
  }
};

const transformInviteToNeedSwitchAdminNotif = async ({userId, SocketIoHelper}) => {
  await transformNotification(userId, "invitation-household-to-user", SocketIoHelper);
};

const transformNeedSwitchAdminToInviteNotif = async ({userId, SocketIoHelper}) => {
  await transformNotification(userId, "need-switch-admin", SocketIoHelper);
};

const injectHouseholdName = (notification) => {
  return injectHouseholdNameNotification(notification);
};

const injectHouseholdNameInNotifArray = (notificationArray) => {
  notificationArray.forEach((notif, index) => {
    notificationArray[index] = injectHouseholdNameNotification(notif);
  });
  return notificationArray;
};

module.exports = {
  transformInviteToNeedSwitchAdminNotif,
  transformNeedSwitchAdminToInviteNotif,
  injectHouseholdName,
  injectHouseholdNameInNotifArray
}