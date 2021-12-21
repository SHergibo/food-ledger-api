const Notification = require('../../../api/models/notification.model');

module.exports.createNotification = async ({adminOne, userOne, adminTwo, userTwo}) => {
  let notificationObject = {
    adminOne : {
      notifReceived: [
        {
          data:{
            type: "need-switch-admin",
            message: `1) AdminOne need switch admin notification received`,
            userId: adminOne._id,
            householdId: adminTwo.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime: 1
        },
        {
          data: {
            type : "invitation-user-to-household",
            senderUserId : userTwo._id,
            message : `2) AdminOne invitation use to household notification received`,
            householdId: adminOne.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime: 1
        },
        {
          data:{
            message: `3) Message d'information pour adminOne notification received`,
            type: 'information',
            householdId: adminOne.householdId,
          },
          numberOfTime: 13
        }
      ],
      notifSended: [
        {
          data: {
            type: "invitation-household-to-user",
            message: `4) AdminOne invitation household to user notification sended`,
            userId: userTwo._id,
            householdId: adminOne.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime: 1
        },
        {
          data: {
            type: "invitation-household-to-user",
            message: `5) AdminOne invitation need switch admin notification sended`,
            userId: adminTwo._id,
            householdId: adminOne.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime: 14
        }
      ]
    },
    userOne: {
      notifReceived: [
        {
          data: {
            type: "invitation-household-to-user",
            message: `6) UserOne invitation household to user notification received`,
            userId: userOne._id,
            householdId: adminTwo.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime: 15
        }
      ],
      notifSended: [
        {
          data : {
            type : "invitation-user-to-household",
            senderUserId : userOne._id,
            message : `7) UserOne invitation user to household notification sended`,
            householdId: adminTwo.householdId,
            urlRequest: "add-user-respond",
          },
          numberOfTime : 15
        }
      ]
    }
  };

  let returnObject =  {
    adminOne: {
      notifReceived: [],
      notifSended: []
    },
    userOne: {
      notifReceived: [],
      notifSended: []
    }
  }

  for (const key in notificationObject) {
    for (const notifArrayKey in notificationObject[key]) {
      for (const element of notificationObject[key][notifArrayKey]) {
        for (let i = 0; i < element.numberOfTime; i++) {
          const newNotif = new Notification(element.data);
          await newNotif.save();
          returnObject[key][notifArrayKey] = [...returnObject[key][notifArrayKey], newNotif];
        }
      }
    }
  }

  return returnObject;
};