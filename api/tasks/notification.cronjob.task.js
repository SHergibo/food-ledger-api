const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      Helpers = require('./../helpers/household.helper');
      Moment = require('moment-timezone'),
      NodeMailer = require('./../../api/helpers/nodemailer.helper'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      { loggerError } = require('./../../config/logger.config'),
      { sendNotifToSocket } = require('./../helpers/sendNotifToSocket.helper');

exports.notification = async () => {
  try {
    let notificationArray = await Notification.find({ type: "request-delegate-admin" });
    let householdLastChanceArray = await Household.find({ "lastChance" : { $exists : true } });
    for (const notif of notificationArray) {
      if (notif.expirationDate < Moment().toDate()) {
        const household = await Household.findById(notif.householdId);
        const membersArray = household.members;
        let user = await User.findById(notif.userId);
        if(membersArray.length === 1){
          return;
        }else{

          let indexMember = membersArray.findIndex(member => member.userData.toString() === user._id.toString());
          membersArray[indexMember].isFlagged = true;
          await Household.findByIdAndUpdate(notif.householdId, { members: membersArray });

          let newArrayMembers = membersArray.filter(member => member.isFlagged !== true);

          if(newArrayMembers.length >= 1){
            let newNotification = await new Notification({
              message: "Vous avez été désigné.e comme nouvel administrateur.trice de cette famille, acceptez-vous cette requête ou passez l'administration à un.e autre membre de votre famille. Attention si vous êtes le/la dernier.ère membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
              householdId: notif.householdId,
              userId: newArrayMembers[0].userData,
              type: "request-delegate-admin",
              urlRequest: "delegate-admin",
              expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
            });
            await newNotification.save();

            socketIoEmit(newArrayMembers[0].userData, [{ name : "updateNotificationReceived", data: newNotification.transform() }]);
            await sendNotifToSocket({userId : newArrayMembers[0].userData, notificationId : newNotification._id, type : "received", addedNotif: true});

          } else {
            if(!household.lastChance){
              for (const member of membersArray) {
                let lastChanceNotification = await new Notification({
                  message: "Ceci est le dernier message pour accepter les droits d'administrations de votre famille, ce message a été envoyé à chaque membre de votre famille, si personne n'accepte endéans les 7 jours, votre famille sera supprimée.",
                  householdId: notif.householdId,
                  userId: member.userData,
                  type: "last-chance-request-delegate-admin",
                  urlRequest: "delegate-admin",
                });
                await lastChanceNotification.save();
                socketIoEmit(member.userData, [{ name : "updateNotificationReceived", data: lastChanceNotification.transform() }]);
                await sendNotifToSocket({userId : member.userData, notificationId : lastChanceNotification._id, type : "received", addedNotif: true});
              }
              await Household.findByIdAndUpdate(notif.householdId, { lastChance: Moment().add({d : 6, h: 23, m: 59, s: 59}).toDate() });
            }
          }
          await Notification.findByIdAndDelete(notif._id);
        }
      }
    }
    for (const household of householdLastChanceArray) {
      if (household.lastChance < Moment().toDate()) {
        await Helpers.noMoreAdmin(household.members, household._id);
      }
    }
  } catch (error) {
    loggerError.error(error);
    NodeMailer.send(error, 'Une erreur est survenue dans la fonction cronJob!');
  }
};