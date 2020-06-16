const Household = require('./../models/household.model'),
  User = require('./../models/user.model'),
  Notification = require('./../models/notification.model'),
  Helpers = require('./helpers/household.helper'),
  Boom = require('@hapi/boom');

/**
* Switch admin request
*/
exports.switchAdminRequest = async (req, res, next) => {
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
    let household = await Household.findById(notification.householdId);
    let arrayMember = household.member;
    if (notification.type === "request-admin") {
      if (req.query.acceptedRequest === "yes") {
        //Chercher si le nouvel admin à une ancienne famille et la supprimer
        let oldHousehold = await Household.findOne({ userId: notification.userId });
        if (oldHousehold) {
          await Household.findByIdAndDelete(oldHousehold._id);
        }

        //Reset isFlagged en false pour les membres de la famille
        for (const otherUser of arrayMember) {
          if (otherUser.isFlagged === true) {
            otherUser.isFlagged = false;
          }
        }

        //Change userId de l'ancien admin par l'userId du nouvel admin, remet isWaiting en false dans household et reset isFlagged en false pour les membres
        await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false, member: arrayMember }, { override: true, upsert: true, new: true });

        //Met le role du nouvel admin en admin
        user = await User.findByIdAndUpdate(notification.userId, { role: "admin" }, { override: true, upsert: true, new: true });
      }
      if (req.query.acceptedRequest === "no") {

        //flague le membre qui n'a pas accepté la requête de changement d'admin
        user = await User.findById(notification.userId);
        let updatedArrayMember = household.member;
        let indexMember = updatedArrayMember.findIndex(obj => obj.usercode === user.usercode);
        updatedArrayMember[indexMember].isFlagged = true;
        await Household.findByIdAndUpdate(notification.householdId, { member: updatedArrayMember }, { override: true, upsert: true, new: true });

        if (req.query.otherMember) {
          let otherMember = await User.findById(req.query.otherMember);

          if (!otherMember) {
            //TODO provisoire
            return res.status(404).send({ error: "User not found!" });
          }

          //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
          let newNotification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
            householdId: notification.householdId,
            userId: otherMember._id,
            type: "request-admin",
            urlRequest: "switch-admin"
          });
          await newNotification.save();

        } else if (!req.query.otherMember) {
          //check si il n'y réellement plus d'autre membre éligible

          arrayMember = household.member;
          let indexMember = arrayMember.findIndex(obj => obj.isFlagged === false);

          if (indexMember >= 0) {
            //TODO provisoire
            return res.status(400).send({ error: "One or more members are still eligible for admin" });
          } else if (indexMember === -1) {
            await Helpers.noMoreAdmin(arrayMember, household._id);
          }
        }
      }

      //Delete la notification
      await Notification.findByIdAndDelete(req.params.notificationId);
    }

    return res.json(user.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};


/**
* Add User request
*/
exports.addUserRequest = async (req, res, next) => {
  try {
    let household = await Household.findOne({ householdcode: req.body.householdcode })
    let userId;
    let message;
    let user = await User.findOne({ usercode: req.body.usercode });
    let otherUserId;
    //If requête household to user ou user to household
    if (req.body.type === "householdToUser") {
      userId = user._id;
      message = `L'administrateur de la famille ${household.householdname} vous invite a rejoindre sa famille. Acceptez-vous l'invitation?`;
    } else if (req.body.type === "userToHousehold") {
      userId = household.userId;
      otherUserId = user._id
      message = `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
    }
    let notification = await new Notification({
      message: message,
      householdId: household._id,
      userId: userId,
      otherUserId : otherUserId,
      type: "request-addUser",
      urlRequest: "add-user-respond"
    });
    await notification.save();

    return res.json(notification);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Add User respond
*/
exports.addUserRespond = async (req, res, next) => {
  try {
    //check si le user est admin ou user si user, directement le switch
    //Si admin
    //Si acceptedRequest === yes et qu'il n'y a pas otherUserId dans la notification
    //switch userId to householdId
    //Si otherUserId
    //switch otherUserId to householdId
    return res.json(household);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};