const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      Helpers = require('./../helpers/household.helper');
      Moment = require('moment-timezone');

//TODO envoyer un mail comme quoi si la famille n'a pas d'admin et que X temps passe la famille sera delete pour cause d'inactivité et d'un manque d'admin.
exports.cronJob = async () => {
  try {
    let notificationArray = await Notification.find({ type: "request-admin" });
    let householdLastChanceArray = await Household.find({ "lastChance" : { $exists : true } });
    for (const notif of notificationArray) {
      if (notif.expirationDate < Moment().toDate()) {
        const household = await Household.findById(notif.householdId);
        const memberArray = household.member;
        let user = await User.findById(notif.userId);
        if(memberArray.length === 1){
          return;
        }else{

          //Flagge l'ancien membre en true
          let indexMember = memberArray.findIndex(obj => obj.usercode === user.usercode);
          memberArray[indexMember].isFlagged = true;
          //Update member array dans household
          await Household.findByIdAndUpdate(notif.householdId, { member: memberArray }, { override: true, upsert: true, new: true });

          //Delete membre ayant déjà reçu une notification pour request switch admin
          let newArrayMember = memberArray.filter(e => e.isFlagged !== true);

          if(newArrayMember.length >= 1){
            //Création nouvelle notif pour le prochain membre eligible
            let newNotification = await new Notification({
              message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
              householdId: notif.householdId,
              userId: newArrayMember[0].userId,
              type: "request-admin",
              urlRequest: "switch-admin",
              expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
            });
            await newNotification.save();

          } else {
            if(!household.lastChance){
              for (const member of memberArray) {
                //Création dernière notification pour changement d'admin pour chaque membre de la famille
                let lastChanceNotification = await new Notification({
                  message: "Ceci est le dernier message pour accepter les droits administrateur de votre famille, ce message a été envoyé à chaque membre de votre famille, si personne n'accepte endeans les 7 jours, votre famille sera supprimer.",
                  householdId: notif.householdId,
                  userId: member.userId,
                  type: "last-chance-request-admin",
                  urlRequest: "switch-admin",
                });
                await lastChanceNotification.save();
              }
              await Household.findByIdAndUpdate(notif.householdId, { lastChance: Moment().add({d : 6, h: 23, m: 59, s: 59}).toDate() }, { override: true, upsert: true, new: true });
            }
          }
          await Notification.findByIdAndDelete(notif._id);
        }
      }
    }
    for (const household of householdLastChanceArray) {
      if (household.lastChance < Moment().toDate()) {
        //delete famille
        await Helpers.noMoreAdmin(household.member, household._id);
      }
    }
  } catch (error) {
    console.log(error);
  }
};