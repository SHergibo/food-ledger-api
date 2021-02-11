const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model')
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      Moment = require('moment-timezone'),
      socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model'),
      { socketIoNotification } = require('./../helpers/socketIo.helper');

/**
* Switch familly and delegate admin request
*/
exports.switchAdminRequest = async (req, res, next) => {
  try {

    if (!req.query.acceptedRequest) {
      return next(Boom.badRequest('invalid query'));
    }

    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return next(Boom.notFound('Notification not found!'));
    }

    let user;
    let household = await Household.findById(notification.householdId);
    let arrayMember = household.member;
    if (req.query.acceptedRequest === "yes") {
      //Chercher si le nouvel admin à une ancienne famille et la supprimer
      let oldHousehold = await Household.findOne({ userId: notification.userId });
      if (oldHousehold) {
        await Helpers.removeHousehold(oldHousehold._id);
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
            return next(Boom.badRequest('User not found!'));
          }

          //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
          let newNotification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
            householdId: notification.householdId,
            userId: otherMember._id,
            type: "request-admin",
            urlRequest: "delegate-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
          });
          await newNotification.save();

          socketIoNotification(otherMember._id, "notifSocketIo", newNotification);

        } else if (!req.query.otherMember) {
          //check si il n'y réellement plus d'autre membre éligible

          arrayMember = household.member;
          let indexMember = arrayMember.findIndex(obj => obj.isFlagged === false);

          if (indexMember >= 0) {
            return next(Boom.badRequest('One or more members are still eligible for admin'));
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

        if(arrayLastChanceNotif.length === 0){
          await Helpers.noMoreAdmin(arrayMember, household._id);
        }
      }
    }

    //Delete la notification
    await Notification.findByIdAndDelete(req.params.notificationId);

    return res.json(user.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Switch Admin rights
*/
exports.switchAdminRights = async (req, res, next) => {
  try {
    let searchNotification = await Notification.findOne({householdId : req.body.householdId, urlRequest: "switch-admin-rights-respond"});
    if(searchNotification){
      return next(Boom.badRequest('Vous avez déjà une demande de délégation de droits administrateurs en attente ! Supprimez votre ancienne demande pour pouvoir en effectuer une nouvelle.'));
    }else{
      let notification = await new Notification({
        message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'administrateur actuel, acceptez-vous cette requête ?",
        householdId: req.body.householdId,
        userId: req.body.userId,
        senderUserId: req.user._id,
        type: "request-admin",
        urlRequest: "switch-admin-rights-respond",
      });
      await notification.save();
      socketIoNotification(req.body.userId, "notifSocketIo", notification);

      let notifWithPopulate = await Notification.findById(notification._id)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      return res.json(notifWithPopulate);
    }
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Switch Admin rights Respond
*/
exports.switchAdminRightsRespond = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.notificationId);
    if(!notification){
      return next(Boom.notFound('Notification not found!'));
    }

    if (!req.query.acceptedRequest) {
      return next(Boom.badRequest('Need a query'));
    }

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") {
      return next(Boom.badRequest('Invalid query'));
    }

    if (req.query.acceptedRequest === "yes") {
      let household = await Household.findById(notification.householdId);
      let oldAdmin = await User.findById(household.userId);
      oldAdmin = await User.findByIdAndUpdate(oldAdmin._id, {role : "user"}, { override: true, upsert: true, new: true });
      let newAdmin = await User.findByIdAndUpdate(notification.userId, {role : "admin"}, { override: true, upsert: true, new: true });

      let arrayMember = household.member;
      let indexUserToChange = arrayMember.findIndex(obj => obj.usercode === newAdmin.usercode);
      let AdminInfoMember = arrayMember[indexUserToChange];
      arrayMember.splice(indexUserToChange, 1);
      arrayMember.unshift(AdminInfoMember);

      household = await Household.findByIdAndUpdate(notification.householdId, {userId : notification.userId, member : arrayMember}, { override: true, upsert: true, new: true });


      let socketIoOldAdmin = await SocketIoModel.findOne({ userId: oldAdmin._id });
      if(socketIoOldAdmin){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoOldAdmin.socketId).emit("updateUserAndFamillyData", {userData : oldAdmin, householdData : household});
      }

      let socketIoNewAdmin = await SocketIoModel.findOne({ userId: newAdmin._id });
      if(socketIoNewAdmin){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoNewAdmin.socketId).emit("updateUserAndFamillyData", {userData : newAdmin, householdData : household});
      }
    }

    await Notification.findByIdAndDelete(notification._id);

    const notifications = await Notification.find({userId : notification.userId});
    const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
    let arrayNotificationsTransformed = [];
    notifications.forEach((item)=>{
        const object = {};
        fields.forEach((field)=>{
            object[field] = item[field];
        });
        arrayNotificationsTransformed.push(object);
    });

    return res.json(arrayNotificationsTransformed);

  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Add User request
*/
exports.addUserRequest = async (req, res, next) => {
  try {
    let household = await Household.findOne({ householdCode: req.body.householdCode });
    let user = await User.findOne({ usercode: req.body.usercode });
    let otherHousehold = await Household.findOne({ householdCode: user.householdCode });

    if(user.householdCode === req.body.householdCode){
      return next(Boom.badRequest('Le membre fait déjà partie de cette famille !'));
    }

    //Check si la famille de la personne recevant ou demandant une requête d'invitation n'a pas une famille avec un statue isWaiting à true
    if (otherHousehold.isWaiting === true) {
      return next(Boom.badRequest("L'utilisateur ne peut pas changer de famille en ce moment, car cette dernière n'a pas d'administrateur!"));
    }

    let notificationObject = {
      householdId: household._id,
      type: "request-addUser",
      urlRequest: "add-user-respond",
      senderUserId: req.user._id,
    }

    if (req.body.type === "householdToUser") {
      notificationObject.userId = user._id;
      notificationObject.message = `L'administrateur de la famille ${household.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`;
    } else if (req.body.type === "userToHousehold") {
      notificationObject.userId = household.userId;
      notificationObject.otherUserId = user._id
      notificationObject.message = `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
      notificationObject = {...notificationObject, ...{fullname: `${user.firstname} ${user.lastname}`,senderUserCode: user.usercode}};
    }

    let notification = await new Notification(notificationObject);
    await notification.save();

    socketIoNotification(notificationObject.userId, "notifSocketIo", notification);

    let notifWithPopulate = await Notification.findById(notification._id)
    .populate({
      path: 'userId',
      select: 'firstname lastname -_id'
    });

    return res.json(notifWithPopulate);
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
      return next(Boom.badRequest('Need a query'));
    }

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") {
      return next(Boom.badRequest('Invalid query'));
    }

    if (req.query.otherMember) {
      let otherMember = await User.findById(req.query.otherMember);

      if (!otherMember) {
        return next(Boom.notFound('Delegate user not found!'));
      }
    }

    let notification = await Notification.findById(req.params.notificationId);
    if(!notification){
      return next(Boom.notFound('Notification not found!'));
    }

    if (req.query.acceptedRequest === "yes") {
      let user;
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

      if(oldHousehold && (oldHousehold.householdCode === newHousehold.householdCode)){
        return next(Boom.badRequest('Le membre fait déjà partie de cette famille !'));
      }

      let newMemberArray = newHousehold.member;

      //Envoie une notification au membre admin ayant d'autre membre dans sa famille si cette admin veut rentrer dans une nouvelle famille en tant que simple user
      if (notification.otherUserId && user.role === "admin" && oldMemberArray.length > 1) {
        //Créée nouvelle notification pour obliger l'user à déléguer ses droit admin à une autre personne avant de pouvoir switch de famille
        let newNotification = await new Notification({
          message: "L'administrateur a accepté votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droits d'administration à un autre membre de votre famille.",
          householdId: newHousehold._id,
          userId: user._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();

        socketIoNotification(user._id, "notifSocketIo", newNotification);

        return res.json(newNotification);
      }

      //Chercher le user dans l'array member de son ancienne famille
      let indexMember = oldMemberArray.findIndex(obj => obj.usercode === user.usercode);

      if (user.role === "admin" && oldMemberArray.length > 1 && !req.query.otherMember) {
        return next(Boom.badRequest('Need a query'));
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
          return next(Boom.badRequest(requestSwitchAdmin.message));
        }
      }

      let socketIoUser = await SocketIoModel.findOne({ userId: user._id });
      if(socketIoUser){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoUser.socketId).emit("updateUserAndFamillyData", {userData : user, householdData : newHousehold});
      }

      let socketIoAdmin = await SocketIoModel.findOne({ userId: newHousehold.userId });
      if(socketIoAdmin){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoAdmin.socketId).emit("updateFamilly", newHousehold);
      }

      if(oldHousehold){
        let socketIoOldAdmin = await SocketIoModel.findOne({ userId: oldHousehold.userId });
        if(socketIoOldAdmin){
          const io = socketIo.getSocketIoInstance();
          io.to(socketIoOldAdmin.socketId).emit("updateFamilly", oldHousehold);
        }
      }
    }

    //Delete la notification
    let oldNotification = await Notification.findByIdAndDelete(notification._id);

    let socketIoSender = await SocketIoModel.findOne({ userId: oldNotification.senderUserId });
    if(socketIoSender){
      const io = socketIo.getSocketIoInstance();
      io.to(socketIoSender.socketId).emit("deleteNotificationSended", oldNotification._id);
    }

    const notifications = await Notification.find({userId : notification.userId});
    const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
    let arrayNotificationsTransformed = [];
    notifications.forEach((item)=>{
        const object = {};
        fields.forEach((field)=>{
            object[field] = item[field];
        });
        arrayNotificationsTransformed.push(object);
    });

    return res.json(arrayNotificationsTransformed);
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};