const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      Moment = require('moment-timezone');

exports.cronJob = async () => {
  try {
    let notificationArray = await Notification.find({ type: "request-admin" });
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

          //Delete membre ayant déjà reçu une notification pour request switch admin
          let newArrayMember = memberArray.filter(e => e.isFlagged !== true);
          console.log(newArrayMember);

          if(newArrayMember.length >= 1){
            //Création nouvelle notif pour le prochain membre eligible
            let newNotification = await new Notification({
              message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
              householdId: notif.householdId,
              userId: newArrayMember[0].userId,
              type: "request-admin",
              urlRequest: "switch-admin",
              expirationDate: Moment().add(1, "minutes").toDate() //TODO mettre 1j à la place d'une minute
            });
            await newNotification.save();

            //Update member array dans household et supprime la notification
            await Household.findByIdAndUpdate(notif.householdId, { member: memberArray }, { override: true, upsert: true, new: true });
            await Notification.findByIdAndDelete(notif._id);
          } else {
            // => ici 
            //création de X notif pour X membre avec 1semaines d'expiration
            //Mettre un nouveau type dans type (last-chance-request-admin?)
            //Si personne ne répond (afk) delete la famille après une semaine et dispatch dans leur ancienne famille si il y en a
            //delete ancienne notif

            // => request controller
            //Si quelqu'un accepte => aller dans request.controller et rajouter la suppression des notifs des autre membres là-bas et deflagguer
            //Si personne n'accepte aller dans request controller et utiliser le nouveau type en conditionnel pour ne pas créer des notifs
             //=> checker si il y a d'autre personne avec des même notif dans la famille
                //=> si oui, supprimer notif de la personne et rien d'autre
                //=> si non, personne n'a accepté donc supprission famille et dispatch member
            
          }


          console.log("ok");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};