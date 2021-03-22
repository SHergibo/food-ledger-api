const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model')
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      Moment = require('moment-timezone'),
      { socketIoEmit } = require('./../helpers/socketIo.helper');

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
    let objectReturn = {};
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
        if (notification.type === "last-chance-request-delegate-admin") {
          await Notification.findOneAndDelete({ userId: otherUser.userId, householdId: notification.householdId, type: "last-chance-request-delegate-admin" });
        }
      }

      let indexUserToChange = arrayMember.findIndex(member => member.userId.toString() === notification.userId.toString());
      let AdminInfoMember = arrayMember[indexUserToChange];
      arrayMember.splice(indexUserToChange, 1);
      arrayMember.unshift(AdminInfoMember);

      //Change userId de l'ancien admin par l'userId du nouvel admin, remet isWaiting en false dans household et reset isFlagged en false pour les membres
      let updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false, member: arrayMember, $unset: { lastChance: "" } }, { override: true, upsert: true, new: true });

      //Met le role du nouvel admin en admin
      user = await User.findByIdAndUpdate(notification.userId, { role: "admin" }, { override: true, upsert: true, new: true });

      objectReturn.userData = user;
      objectReturn.householdData = updatedHousehold;

      for (const otherUser of arrayMember){
        if(otherUser.userId.toString() !== user._id.toString()){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: updatedHousehold}]);
        }
      }
    }
    if (req.query.acceptedRequest === "no") {
      user = await User.findById(notification.userId);
      if (notification.type === "request-delegate-admin") {
        if (req.query.otherMember) {
          //flague le membre qui n'a pas accepté la requête de changement d'admin
          let updatedArrayMember = household.member;
          let indexMember = updatedArrayMember.findIndex(obj => obj.usercode === user.usercode);
          updatedArrayMember[indexMember].isFlagged = true;
          let updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { member: updatedArrayMember }, { override: true, upsert: true, new: true });
          objectReturn.householdData = updatedHousehold;

          let otherMember = await User.findById(req.query.otherMember);

          if (!otherMember) {
            return next(Boom.badRequest('User not found!'));
          }

          //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
          let newNotification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée !",
            householdId: notification.householdId,
            userId: otherMember._id,
            type: "request-delegate-admin",
            urlRequest: "delegate-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
          });
          await newNotification.save();

          socketIoEmit(otherMember._id, 
            [
              {name : "updateFamilly", data: updatedHousehold},
              {name : "notifSocketIo", data: newNotification}
            ]
          );

        } else if (!req.query.otherMember) {
          //check si il n'y réellement plus d'autre membre éligible

          arrayMember = household.member;
          let indexMember = arrayMember.findIndex(member => member.isFlagged === false && member.userId.toString() !== notification.userId.toString());

          if (indexMember >= 0) {
            return next(Boom.badRequest('One or more members are still eligible for admin'));
          } else if (indexMember === -1) {
            await Helpers.noMoreAdmin(arrayMember, household._id);
          }
        }
      }
      if(notification.type === "last-chance-request-delegate-admin"){
        let arrayLastChanceNotif = [];

        for (const member of arrayMember) {
          let lastChanceNotif = await Notification.findOne({userId : member.userId, householdId : household._id, type : "last-chance-request-delegate-admin"});
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
    if(notification.type !== "last-chance-request-delegate-admin"){
      await Notification.findByIdAndDelete(req.params.notificationId);
    }

    const notificationsReceived = await Notification.find({userId : notification.userId});
    const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
    let arrayNotificationsReceivedTransformed = [];
    notificationsReceived.forEach((item)=>{
        const object = {};
        fields.forEach((field)=>{
            object[field] = item[field];
        });
        arrayNotificationsReceivedTransformed.push(object);
    });

    objectReturn.notificationsReceived = arrayNotificationsReceivedTransformed;

    return res.json(objectReturn);
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
      socketIoEmit(req.body.userId, [{name : "notifSocketIo", data: notification}]);

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

    let objectReturn = {};

    await Notification.findByIdAndDelete(notification._id);

    if (req.query.acceptedRequest === "yes") {
      let household = await Household.findById(notification.householdId);
      let oldAdmin = await User.findById(household.userId);
      // oldAdmin = await User.findByIdAndUpdate(oldAdmin._id, {role : "user"}, { override: true, upsert: true, new: true });
      let newAdmin = await User.findByIdAndUpdate(notification.userId, {role : "admin"}, { override: true, upsert: true, new: true });

      let arrayMember = household.member;
      let indexUserToChange = arrayMember.findIndex(member => member.userId.toString() === newAdmin._id.toString());
      let AdminInfoMember = arrayMember[indexUserToChange];
      arrayMember.splice(indexUserToChange, 1);
      arrayMember.unshift(AdminInfoMember);

      const needSwitctAdminNotif = await Notification.findOne({userId : oldAdmin._id, type: "need-switch-admin"});

      if(!needSwitctAdminNotif){
        oldAdmin = await User.findByIdAndUpdate(oldAdmin._id, {role : "user"}, { override: true, upsert: true, new: true });
      }else{
        let newHousehold = await Household.findById(needSwitctAdminNotif.householdId);
        oldAdmin = await User.findByIdAndUpdate(oldAdmin._id, {role : "user", householdCode: newHousehold.householdCode}, { override: true, upsert: true, new: true });
        let indexMemberToDelete = arrayMember.findIndex(member => member.userId.toString() === oldAdmin._id.toString());
        let infoMemberDeleted = [];
        if (indexMemberToDelete > -1) {
          infoMemberDeleted = arrayMember.splice(indexMemberToDelete, 1);
        }
        let newHouseholdMember = newHousehold.member;
        newHouseholdMember.push(infoMemberDeleted[0]);
        newHousehold = await Household.findByIdAndUpdate(newHousehold._id, { member: newHouseholdMember }, { override: true, upsert: true, new: true });
        await Notification.findByIdAndDelete(needSwitctAdminNotif._id);

        for (const otherUser of newHousehold.member){
          if(otherUser.userId.toString() !== oldAdmin._id.toString()){
            socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: newHousehold}]);
          }
        }
      }

      household = await Household.findByIdAndUpdate(notification.householdId, {userId : notification.userId, member : arrayMember}, { override: true, upsert: true, new: true });
      
      const notificationsReceived = await Notification.find({userId : oldAdmin._id});
      const notificationsSended= await Notification.find({senderUserId: oldAdmin._id})
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      socketIoEmit(oldAdmin._id, 
        [
          {name : "updateUserAndFamillyData", data: {userData : oldAdmin, householdData : household}},
          {name : "updateAllNotifications", data: {notificationsReceived : notificationsReceived, notificationsSended : notificationsSended}},
        ]
      );

      for (const otherUser of household.member){
        if(otherUser.userId.toString() !== oldAdmin._id.toString() && otherUser.userId.toString() !== notification.userId.toString()){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: household}]);
        }
      }

      objectReturn.userData = newAdmin;
      objectReturn.householdData = household;
    }

    const transformNotificationArray = (notificationArray, withUserId = false) => {
      let fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
  
      if(withUserId){
        fields.push('userId')
      }
      
      let arrayNotificationsTransformed = [];
      notificationArray.forEach((item) => {
        const object = {};
        fields.forEach((field) => {
          object[field] = item[field];
        });
        arrayNotificationsTransformed.push(object);
      });
      return arrayNotificationsTransformed;
    }
    
    const notificationsReceived = await Notification.find({userId : notification.userId});
    objectReturn.notificationsReceived = transformNotificationArray(notificationsReceived);

    if (req.query.acceptedRequest === "yes"){
      const notificationsSended = await Notification.find({$or : [{senderUserId: notification.userId},{householdId : notification.householdId, type: "invitation-household-to-user"}]})
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      }); 
      objectReturn.notificationsSended = transformNotificationArray(notificationsSended, true);
    }else if (req.query.acceptedRequest === "no"){
      socketIoEmit(notification.senderUserId, [{ name : "deleteNotificationSended", data: notification._id }]);
    }

    return res.json(objectReturn);

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
    let household = await Household.findOne({ householdCode: req.body.householdCode });
    let user = await User.findOne({ usercode: req.body.usercode });

    if(!user){
      return next(Boom.badRequest('Code utilisateur non valide !'));
    }

    if(!household){
      return next(Boom.badRequest('Code famille non valide !'));
    }

    let otherHousehold = await Household.findOne({ householdCode: user.householdCode });

    let notificationExist = await Notification.findOne({$or : [{type: "invitation-household-to-user", userId: user._id},{type: "invitation-user-to-household", userId: household.userId}]});

    if(notificationExist){
      let errorMessage = "";
      if(req.body.type === "userToHousehold"){
        errorMessage = "Vous avez déjà envoyé une invitation à cette famille !"
      }else{
        errorMessage = "Vous avez déjà envoyé une invitation à cette personne !"
      }
      return next(Boom.badRequest(errorMessage));
    }

    if(user.householdCode === req.body.householdCode){
      return next(Boom.badRequest('Le membre fait déjà partie de cette famille !'));
    }

    //Check si la famille de la personne recevant ou demandant une requête d'invitation n'a pas une famille avec un statue isWaiting à true
    if (otherHousehold.isWaiting === true) {
      return next(Boom.badRequest("L'utilisateur ne peut pas changer de famille en ce moment, car cette dernière n'a pas d'administrateur!"));
    }

    let notificationObject = {
      householdId: household._id,
      urlRequest: "add-user-respond",
    }

    if (req.body.type === "householdToUser") {
      let householdSender = await Household.findOne({ householdCode: user.householdCode });
      if(user.role === "user" || (user.role === "admin" && householdSender.member.length === 1)){
        notificationObject.type = "invitation-household-to-user"
        notificationObject.message = `L'administrateur de la famille ${household.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`;
      }else{
        notificationObject.message = `L'administrateur de la famille ${household.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un autre membre de votre famille avant de pouvoir changer de famille.`
        notificationObject.type = "need-switch-admin"
      }
      notificationObject.userId = user._id;
    } else if (req.body.type === "userToHousehold") {
      notificationObject.userId = household.userId;
      notificationObject.type = "invitation-user-to-household"
      notificationObject.otherUserId = user._id
      notificationObject.senderUserId = req.user._id,
      notificationObject.message = `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
      notificationObject = {...notificationObject, ...{fullname: `${user.firstname} ${user.lastname}`,senderUserCode: user.usercode}};
    }

    let notification = await new Notification(notificationObject);
    await notification.save();

    socketIoEmit(notificationObject.userId, [{name : "notifSocketIo", data: notification}]);

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
      return next(Boom.badRequest('Need a query!'));
    }

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") {
      return next(Boom.badRequest('Invalid query!'));
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
    if(notification.urlRequest !== 'add-user-respond'){
      return next(Boom.badRequest('Wrong notification!'));
    }
    
    if(notification.type === "need-switch-admin"){
      let notificationRequestAdmin = await Notification.findOne({type: "request-admin", senderUserId : req.user._id});
      if(notificationRequestAdmin){
        return next(Boom.badRequest("Vous ne pouvez pas déléguer vos droits d'administrations si une autre requête de délégation de droits est en cour !"));
      }
    }


    let oldNotification = await Notification.findByIdAndDelete(notification._id);

    if(oldNotification.senderUserId){
      socketIoEmit(oldNotification.senderUserId, [{name : "deleteNotificationSended", data: oldNotification._id}]);
    }else if (oldNotification.householdId){
      let household = await Household.findById(oldNotification.householdId);
      socketIoEmit(household.userId, [{name : "deleteNotificationSended", data: oldNotification._id}]);
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

        socketIoEmit(user._id, [{name : "notifSocketIo", data: newNotification}]);
        
        return res.json({notificationsReceived : arrayNotificationsTransformed});
      }

      //Chercher le user dans l'array member de son ancienne famille
      let indexMember = oldMemberArray.findIndex(obj => obj.usercode === user.usercode);

      if (oldHousehold) {
        newMemberArray.push(oldMemberArray[indexMember]);
      } else {
        let objectMember = await Helpers.createObjectMember(user);
        newMemberArray.push(objectMember);
      }
      //Ajoute le membre dans sa nouvelle famille
      let updatedNewHousehold = await Household.findByIdAndUpdate(newHousehold._id, { member: newMemberArray }, { override: true, upsert: true, new: true });

      let updatedOldHousehold;
      //check si le membre est user
      if (user.role === "user") {
        //Change le householdCode dans user
        user = await User.findByIdAndUpdate(user._id, { householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        if (oldHousehold) {
          //Supprime le membre de son ancienne famille
          oldMemberArray.splice(indexMember, 1);
          updatedOldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { member: oldMemberArray }, { override: true, upsert: true, new: true });
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
      let requestSwitchAdmin = {};
      if (user.role === "admin" && oldMemberArray.length > 1 && req.query.otherMember) {
        //Change le rôle d'admin en user et le householdCode
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        //Supprimer le membre de son ancienne famille et créée et envoie une notification au délégué(e)
        requestSwitchAdmin = await Helpers.requestSwitchAdmin(user._id, req.query.otherMember);
        if (requestSwitchAdmin) {
          return next(Boom.badRequest(requestSwitchAdmin.message));
        }
      }
      
      if(user.role === "admin" && oldMemberArray.length > 1){
        if (indexMember > -1) {
          oldMemberArray.splice(indexMember, 1);
        }
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });
        //no more admin
        await Helpers.noMoreAdmin(oldMemberArray, oldHousehold._id);
      }

      socketIoEmit(user._id, [{name : "updateUserAndFamillyData", data: {userData : user, householdData : updatedNewHousehold}}]);

      for (const otherUser of updatedNewHousehold.member){
        if(otherUser.userId.toString() !== user._id.toString()){
          if(otherUser.userId.toString() !== updatedNewHousehold.userId.toString()){
            socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: updatedNewHousehold}]);
          }else{
            socketIoEmit(otherUser.userId, [
              {name : "updateFamilly", data: updatedNewHousehold},
              {name : "deleteNotificationSended", data: req.params.notificationId},
            ]);
          }
        }
      }

      if(updatedOldHousehold){
        for (const otherUser of updatedOldHousehold.member){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: updatedOldHousehold}]);
        }
      }
      
    }

    return res.json({notificationsReceived : arrayNotificationsTransformed});
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};