const Household = require('./../models/household.model'),
  User = require('./../models/user.model'),
  Notification = require('./../models/notification.model'),
  Helpers = require('./helpers/household.helper'),
  Boom = require('@hapi/boom');

/**
* Get request and use it
*/
exports.applyRequest = async (req, res, next) => {
  try {

    if (!req.query.acceptedRequest) {
      //TODO provisoire
      return res.status(400).send({ error: "Query needed" });
    }

    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      //TODO provisoire
      return res.status(404).send({ error: "Notification not found!" });
    }

    let user;
    if (notification.type === "request-admin") {
      if (req.query.acceptedRequest === "yes") {
        //Chercher si le nouvel admin à une ancienne famille et la supprimer
        let oldHousehold = await Household.find({ userId: notification.userId });
        if (oldHousehold) {
          await Household.findByIdAndDelete(oldHousehold._id);
        }

        //Change userId de l'ancien admin par l'userId du nouvel admin et remet isWaiting en false dans household
        await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false }, { override: true, upsert: true, new: true });

        //Met le role du nouvel admin en admin
        user = await User.findByIdAndUpdate(notification.userId, { role: "admin" }, { override: true, upsert: true, new: true });


      }
      if (req.query.acceptedRequest === "no") {

        //flague le membre qui n'a pas accepter le requête de changement d'admin
        user = await User.findById(notification.userId);
        let household = await Household.findById(notification.householdId);
        let updatedArrayMember = household.member;
        let indexMember = updatedArrayMember.findIndex(obj => obj.usercode === user.usercode);
        updatedArrayMember[indexMember].isFlaged = true;
        await Household.findByIdAndUpdate(notification.householdId, { member: updatedArrayMember }, { override: true, upsert: true, new: true });

        if (req.query.otherMember) {
          let othermember = await User.findById(req.query.otherMember);

          if (!othermember) {
            //TODO provisoire
            return res.status(404).send({ error: "User not found!" });
          }

          //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
          let newNotification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
            householdId: notification.householdId,
            userId: othermember._id,
            type: "request-admin"
          });
          await newNotification.save();

          //Supprimer ancienne notification
          await Notification.findByIdAndDelete(notification._id);
        } else {
          //delete famille, faire helper pour remettre membre dans ancienne famille ou mettre "none"
        }
      }

      //Delete la notification
      // await Notification.findByIdAndDelete(req.params.notificationId);
    }

    // return res.json(user.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};