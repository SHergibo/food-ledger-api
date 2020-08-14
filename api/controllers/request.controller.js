const Household = require('./../models/household.model'),
  User = require('./../models/user.model'),
  Notification = require('./../models/notification.model'),
  Helpers = require('./helpers/household.helper'),
  Boom = require('@hapi/boom'),
  Moment = require('moment-timezone');

/**
* Switch admin request
*/
exports.switchAdminRequest = async (req, res, next) => {
  try {

    if (!req.query.acceptedRequest) {
      return res.status(400).send(Boom.badRequest('invalid query'));
    }

    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).send(Boom.badRequest('Notification not found!'));
    }

    let user;
    let household = await Household.findById(notification.householdId);
    let arrayMember = household.member;
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
        if (notification.type === "last-chance-request-admin") {
          await Notification.findOneAndDelete({ userId: otherUser.userId, householdId: notification.householdId, type: "last-chance-request-admin" });
        }
      }

      //Change userId de l'ancien admin par l'userId du nouvel admin, remet isWaiting en false dans household et reset isFlagged en false pour les membres
      await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false, member: arrayMember, $unset: { lastChance: "" } }, { override: true, upsert: true, new: true });

      //Met le role du nouvel admin en admin
      user = await User.findByIdAndUpdate(notification.userId, { role: "admin" }, { override: true, upsert: true, new: true });

    }
    if (req.query.acceptedRequest === "no") {
      user = await User.findById(notification.userId);
      if (notification.type === "request-admin") {
        //flague le membre qui n'a pas accepté la requête de changement d'admin
        let updatedArrayMember = household.member;
        let indexMember = updatedArrayMember.findIndex(obj => obj.usercode === user.usercode);
        updatedArrayMember[indexMember].isFlagged = true;
        await Household.findByIdAndUpdate(notification.householdId, { member: updatedArrayMember }, { override: true, upsert: true, new: true });

        if (req.query.otherMember) {
          let otherMember = await User.findOne({ usercode: req.query.otherMember });

          if (!otherMember) {
            return res.status(404).send(Boom.badRequest('User not found!'));
          }

          //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
          let newNotification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
            householdId: notification.householdId,
            userId: otherMember._id,
            type: "request-admin",
            urlRequest: "switch-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
          });
          await newNotification.save();

        } else if (!req.query.otherMember) {
          //check si il n'y réellement plus d'autre membre éligible

          arrayMember = household.member;
          let indexMember = arrayMember.findIndex(obj => obj.isFlagged === false);

          if (indexMember >= 0) {
            return res.status(400).send(Boom.badRequest('One or more members are still eligible for admin'));
          } else if (indexMember === -1) {
            await Helpers.noMoreAdmin(arrayMember, household._id);
          }
        }
      }
      if(notification.type === "last-chance-request-admin"){
        await Notification.findByIdAndDelete(req.params.notificationId);
        let arrayLastChanceNotif = [];

        for (const member of arrayMember) {
          let lastChanceNotif = await Notification.findOne({userId : member.userId, householdId : household._id, type : "last-chance-request-admin"});
          if(lastChanceNotif){
            arrayLastChanceNotif.push(lastChanceNotif);
          }
        }
        console.log(arrayLastChanceNotif);

        if(arrayLastChanceNotif.length === 0){
          await Helpers.noMoreAdmin(arrayMember, household._id);
        }
      }
    }

    //Delete la notification
    await Notification.findByIdAndDelete(req.params.notificationId);

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
    let household = await Household.findOne({ householdCode: req.body.householdCode })
    let userId;
    let message;
    let user = await User.findOne({ usercode: req.body.usercode });
    let otherHousehold = await Household.findOne({ householdCode: user.householdCode });
    let otherUserId;

    //Check si la famille de la personne recevant ou demandant une requête d'invitation n'a pas une famille avec un statue isWaiting à true
    if (otherHousehold.isWaiting === true) {
      return res.status(400).send(Boom.badRequest("User can't switch familly at the moment because it's familly doesn't have an admin"));
    }

    if (req.body.type === "householdToUser") {
      userId = user._id;
      message = `L'administrateur de la famille ${household.householdName} vous invite a rejoindre sa famille. Acceptez-vous l'invitation?`;
    } else if (req.body.type === "userToHousehold") {
      userId = household.userId;
      otherUserId = user._id
      message = `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
    }
    let notification = await new Notification({
      message: message,
      householdId: household._id,
      userId: userId,
      otherUserId: otherUserId,
      type: "request-addUser",
      urlRequest: "add-user-respond"
    });
    await notification.save();

    return res.json(notification.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Add User respond
*/
exports.addUserRespond = async (req, res, next) => {
  try {

    if (!req.query.acceptedRequest) {
      return res.status(400).send(Boom.badRequest('Need a query'));
    }

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") {
      return res.status(400).send(Boom.badRequest('Invalid query'));
    }

    if (req.query.otherMember) {
      let otherMember = await User.findById(req.query.otherMember);

      if (!otherMember) {
        return res.status(400).send(Boom.badRequest('Delegate user not found!'));
      }
    }

    let notification = await Notification.findById(req.params.notificationId);
    let user;
    if (req.query.acceptedRequest === "yes") {

      if (notification.otherUserId) {
        user = await User.findById(notification.otherUserId);
      } else {
        user = await User.findById(notification.userId);
      }


      let oldHousehold = await Household.findOne({ householdCode: user.householdCode });
      let oldMemberArray = [];
      if (oldHousehold) {
        oldMemberArray = oldHousehold.member;
      }
      let newHousehold = await Household.findById(notification.householdId);
      let newMemberArray = newHousehold.member;

      //Envoie une notification au membre admin ayant d'autre membre dans sa famille si cette admin veut rentrer dans une nouvelle famille en tant que simple user
      if (notification.otherUserId && user.role === "admin" && oldMemberArray.length > 1) {
        //Créée nouvelle notification pour obliger l'user à déléguer ses droit admin à une autre personne avant de pouvoir switch de famille
        let newNotification = await new Notification({
          message: "L'administrateur a accepté votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droit d'administration à un autre membre de votre famille.",
          householdId: newHousehold._id,
          userId: user._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await notification.save();
        return res.json(newNotification);
      }

      //Chercher le user dans l'array member de son ancienne famille
      let indexMember = oldMemberArray.findIndex(obj => obj.usercode === user.usercode);

      if (user.role === "admin" && oldMemberArray.length > 1 && !req.query.otherMember) {
        return res.status(400).send(Boom.badRequest('Need a query'));
      }

      if (oldHousehold) {
        newMemberArray.push(oldMemberArray[indexMember]);
      } else {
        let objectMember = await Helpers.createObjectMember(user);
        newMemberArray.push(objectMember);
      }
      //Ajoute le membre dans sa nouvelle famille
      await Household.findByIdAndUpdate(newHousehold._id, { member: newMemberArray }, { override: true, upsert: true, new: true });


      //check si le membre est user
      if (user.role === "user") {
        //Change le householdCode dans user
        user = await User.findByIdAndUpdate(user._id, { householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        if (oldHousehold) {
          //Supprime le membre de son ancienne famille
          oldMemberArray.splice(indexMember, 1);
          await Household.findByIdAndUpdate(oldHousehold._id, { member: oldMemberArray }, { override: true, upsert: true, new: true });
        }

      }

      //check si le membre est admin et qu'il n'y a aucun membre dans sa famille
      if (user.role === "admin" && oldMemberArray.length === 1) {
        //Change le rôle d'admin en user et le householdCode
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        //Supprime le membre de son ancienne famille
        oldMemberArray = [];
        await Household.findByIdAndUpdate(oldHousehold._id, { member: oldMemberArray }, { override: true, upsert: true, new: true });
      }

      //check si le membre est admin et qu'il y a d'autre membre dans sa famille et utiliser query otherMember
      if (user.role === "admin" && oldMemberArray.length > 1 && req.query.otherMember) {
        //Change le rôle d'admin en user et le householdCode
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        //Supprimer le membre de son ancienne famille et créée et envoie une notification au délégué(e)
        let requestSwitchAdmin = await Helpers.requestSwitchAdmin(user._id, req.query.otherMember);
        if (requestSwitchAdmin.status) {
          return res.status(400).send(Boom.badRequest(requestSwitchAdmin.message));
        }
      }
    }

    //Delete la notification
    await Notification.findByIdAndDelete(notification._id);

    return res.json(user.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};