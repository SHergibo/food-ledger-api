const Notification = require('../../../api/models/notification.model');

module.exports.createNotification = async ({adminOne, userOne, adminTwo, userTwo}) => {
  let notificationObject = {
    adminOne : {
      notifReceived: [
        {
          type: "need-switch-admin",
          message: `1) AdminOne need switch admin notification received`,
          userId: adminOne._id,
          householdId: adminTwo.householdId,
          urlRequest: "add-user-respond",
        },
        {
          type : "invitation-user-to-household",
          senderUserId : userTwo._id,
          message : `2) AdminOne invitation use to household notification received`,
          householdId: adminOne.householdId,
          urlRequest: "add-user-respond",
        },
        {
          message: `3) Message d'information pour adminOne notification received`,
          type: 'information',
          householdId: adminOne.householdId,
        }
      ],
      notifSended: [
        {
          type: "invitation-household-to-user",
          message: `4) AdminOne invitation household to user notification sended`,
          userId: userTwo._id,
          householdId: adminOne.householdId,
          urlRequest: "add-user-respond",
        },
        {
          type: "invitation-household-to-user",
          message: `5) AdminOne invitation need switch admin notification sended`,
          userId: adminTwo._id,
          householdId: adminOne.householdId,
          urlRequest: "add-user-respond",
        }
      ]
    },
    userOne: {
      notifReceived: [
        {
          type: "invitation-household-to-user",
          message: `6) UserOne invitation household to user notification received`,
          userId: userOne._id,
          householdId: adminTwo.householdId,
          urlRequest: "add-user-respond",
        }
      ],
      notifSended: [
        {
          type : "invitation-user-to-household",
          senderUserId : userOne._id,
          message : `7) UserOne invitation user to household notification sended`,
          householdId: adminTwo.householdId,
          urlRequest: "add-user-respond",
        }
      ]
    }
  };

  for (const key in notificationObject) {
    for (const notifArrayKey in notificationObject[key]) {
      for (const [index, element] of notificationObject[key][notifArrayKey].entries()) {
        const newNotif = new Notification(element);
        await newNotif.save();
        notificationObject[key][notifArrayKey][index] = newNotif;
      }
    }
  }

  return notificationObject;
};