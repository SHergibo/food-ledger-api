const Household = require('./../models/household.model'),
      Notification = require('./../models/notification.model'),
      { socketIoEmit } = require('./../helpers/socketIo.helper');

module.exports.transformInviteToNeedSwitchAdminNotif = async (userId) => {
  let inviteNotification = await Notification.find({userId : userId, type: "invitation-household-to-user"});
  if(inviteNotification.length >= 1){
    for (const notif of inviteNotification) {
      const otherHousehold = await Household.findById(notif.householdId);
      let needSwitchAdminNotification = await new Notification({
        message: `L'administrateur.trice de la famille ${otherHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`,
        householdId: notif.householdId,
        userId: notif.userId,
        type: "need-switch-admin",
        urlRequest: "add-user-respond",
      });
      await needSwitchAdminNotification.save(); 

      await Notification.findByIdAndDelete(notif._id);

      socketIoEmit(notif.userId, 
        [
          {name : "deleteNotificationReceived", data: notif._id},
          {name : "updateNotificationReceived", data: needSwitchAdminNotification.transform()},
        ]
      );

      let notificationSended = await Notification.findById(needSwitchAdminNotification._id)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      socketIoEmit(otherHousehold.userId, 
        [
          {name : "deleteNotificationSended", data: notif._id},
          {name : "updateNotificationSended", data: notificationSended.transform(true)},
        ]
      ); 
    }
  }
};