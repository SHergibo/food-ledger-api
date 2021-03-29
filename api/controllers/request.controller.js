const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      Moment = require('moment-timezone'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      { transformArray } = require('./../helpers/transformArray.helper');

/**
* Switch familly and delegate admin request
*/
exports.switchAdminRequest = async (req, res, next) => {
  try {

    if (!req.query.acceptedRequest) {
      return next(Boom.badRequest('invalid query'));
    }

    const notification = await Notification.findById(req.params.notificationId);

    if(notification.type !== "last-chance-request-delegate-admin"){
      await Notification.findByIdAndDelete(notification._id);
    }
    
    if (!notification) {
      return next(Boom.notFound('Notification not found!'));
    }

    let user;
    let household = await Household.findById(notification.householdId);
    let arrayMember = household.member;
    if (req.query.acceptedRequest === "yes") {
      let oldHousehold = await Household.findOne({ userId: notification.userId });
      if (oldHousehold) {
        await Helpers.removeHousehold(oldHousehold._id);
      }

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

      let updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false, member: arrayMember, $unset: { lastChance: "" } }, { override: true, upsert: true, new: true });

      user = await User.findByIdAndUpdate(notification.userId, { role: "admin" }, { override: true, upsert: true, new: true });

      const newAdminNotificationsSended = await Notification.find(
        {$or : 
          [
            {senderUserId: notification.userId},
            {householdId : notification.householdId, type: "invitation-household-to-user"},
            {householdId : notification.householdId, type: "need-switch-admin"}
          ]
        })
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        }); 

      const newAdminNotificationsReceived = await Notification.find({userId : notification.userId});

      socketIoEmit(notification.userId, 
        [
          {name : "updateUserAndFamillyData", data: {userData : user, householdData : updatedHousehold}},
          {name : "updateAllNotifications", data: {notificationsReceived : transformArray(newAdminNotificationsReceived, "notification"), notificationsSended : transformArray(newAdminNotificationsSended, "notificationUserId")}},
        ]
      );

      for (const otherUser of arrayMember){
        if(otherUser.userId.toString() !== user._id.toString()){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: updatedHousehold}]);
        }
      }

      const invitationNotif = await Notification.findOne({userId : notification.userId, type: "invitation-household-to-user"});

      if(invitationNotif){
        let invitationHousehold = await Household.findById(invitationNotif.householdId);
        let newNotification = await new Notification({
          message: `L'administrateur de la famille ${invitationHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un autre membre de votre famille avant de pouvoir changer de famille.`,
          householdId: invitationHousehold._id,
          userId: user._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();
        await Notification.findByIdAndDelete(invitationNotif._id);

        const newNotifSended = await Notification.findById(newNotification._id)
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        });  

        socketIoEmit(invitationHousehold.userId, 
          [
            {name : "deleteNotificationSended", data: invitationNotif._id},
            {name : "updateNotificationSended", data: newNotifSended},
          ]
        );
      }
    }
    if (req.query.acceptedRequest === "no") {
      user = await User.findById(notification.userId);
      if (notification.type === "request-delegate-admin") {
        if (req.query.otherMember) {
          let updatedArrayMember = household.member;
          let indexMember = updatedArrayMember.findIndex(obj => obj.usercode === user.usercode);
          updatedArrayMember[indexMember].isFlagged = true;
          let updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { member: updatedArrayMember }, { override: true, upsert: true, new: true });

          socketIoEmit(user._id, [{name : "updateFamilly", data: updatedHousehold}]);

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
              {name : "updateNotificationReceived", data: newNotification}
            ]
          );

        } else if (!req.query.otherMember) {
          arrayMember = household.member;
          let indexMember = arrayMember.findIndex(member => member.isFlagged === false && member.userId.toString() !== notification.userId.toString());

          if (indexMember >= 0) {
            return next(Boom.badRequest('One or more members are still eligible for admin'));
          } else if (indexMember === -1) {
            await Helpers.noMoreAdmin(arrayMember, household._id);
          }
        }
        socketIoEmit(notification.userId, [{ name : "deleteNotificationReceived", data: notification._id }]);
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

    return res.status(204).send();
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
      socketIoEmit(req.body.userId, [{name : "updateNotificationReceived", data: notification}]);

      let notifWithPopulate = await Notification.findById(notification._id)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      socketIoEmit(req.user._id, [{name : "updateNotificationSended", data: notifWithPopulate}]);

      return res.status(204).send();
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

    await Notification.findByIdAndDelete(notification._id);

    if (req.query.acceptedRequest === "yes") {
      let household = await Household.findById(notification.householdId);
      let oldAdmin = await User.findById(household.userId);
      oldAdmin = await User.findByIdAndUpdate(oldAdmin._id, {role : "user"}, { override: true, upsert: true, new: true });
      let newAdmin = await User.findByIdAndUpdate(notification.userId, {role : "admin"}, { override: true, upsert: true, new: true });

      let arrayMember = household.member;
      let indexUserToChange = arrayMember.findIndex(member => member.userId.toString() === newAdmin._id.toString());
      let AdminInfoMember = arrayMember[indexUserToChange];
      arrayMember.splice(indexUserToChange, 1);
      arrayMember.unshift(AdminInfoMember);

      const needSwitchAdminNotif = await Notification.findOne({userId : oldAdmin._id, type: "need-switch-admin"});

      if(needSwitchAdminNotif){
        let invitationHousehold = await Household.findById(needSwitchAdminNotif.householdId);
        let newNotification = await new Notification({
          message: `L'administrateur de la famille ${invitationHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
          householdId: invitationHousehold._id,
          userId: oldAdmin._id,
          type: "invitation-household-to-user",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();
        await Notification.findByIdAndDelete(needSwitchAdminNotif._id);

        const newNotifSended = await Notification.findById(newNotification._id)
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        });  

        socketIoEmit(invitationHousehold.userId, 
          [
            {name : "deleteNotificationSended", data: needSwitchAdminNotif._id},
            {name : "updateNotificationSended", data: newNotifSended},
          ]
        );
      }

      const invitationNotif = await Notification.findOne({userId : notification.userId, type: "invitation-household-to-user"});

      if(invitationNotif){
        let invitationHousehold = await Household.findById(invitationNotif.householdId);
        let newNotification = await new Notification({
          message: `L'administrateur de la famille ${invitationHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un autre membre de votre famille avant de pouvoir changer de famille.`,
          householdId: invitationHousehold._id,
          userId: newAdmin._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();
        await Notification.findByIdAndDelete(invitationNotif._id);

        const newNotifSended = await Notification.findById(newNotification._id)
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        });  

        socketIoEmit(invitationHousehold.userId, 
          [
            {name : "deleteNotificationSended", data: invitationNotif._id},
            {name : "updateNotificationSended", data: newNotifSended},
          ]
        );
      }

      household = await Household.findByIdAndUpdate(notification.householdId, {userId : notification.userId, member : arrayMember}, { override: true, upsert: true, new: true });
      
      const oldAdminNotificationsReceived = await Notification.find({userId : oldAdmin._id});
      const oldAdminNotificationsSended = await Notification.find({senderUserId: oldAdmin._id})
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      socketIoEmit(oldAdmin._id, 
        [
          {name : "updateUserAndFamillyData", data: {userData : oldAdmin, householdData : household}},
          {name : "updateAllNotifications", data: {notificationsReceived : oldAdminNotificationsReceived, notificationsSended : oldAdminNotificationsSended}},
        ]
      );

      for (const otherUser of household.member){
        if(otherUser.userId.toString() !== oldAdmin._id.toString() && otherUser.userId.toString() !== notification.userId.toString()){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: household}]);
        }
      }

      const newAdminNotificationsSended = await Notification.find(
        {$or : 
          [
            {senderUserId: notification.userId},
            {householdId : notification.householdId, type: "invitation-household-to-user"},
            {householdId : notification.householdId, type: "need-switch-admin"}
          ]
        })
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        }); 

      const newAdminNotificationsReceived = await Notification.find({userId : notification.userId});

      socketIoEmit(notification.userId, 
        [
          {name : "updateUserAndFamillyData", data: {userData : newAdmin, householdData : household}},
          {name : "updateAllNotifications", data: {notificationsReceived : transformArray(newAdminNotificationsReceived, "notification"), notificationsSended : transformArray(newAdminNotificationsSended, "notificationUserId")}},
        ]
      );
    }

    if(req.query.acceptedRequest === "no"){
      socketIoEmit(notification.senderUserId, [{ name : "deleteNotificationSended", data: notification._id }]);
      socketIoEmit(notification.userId, [{ name : "deleteNotificationReceived", data: notification._id }]);
    }

    return res.status(204).send();
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

    if(!user){
      return next(Boom.badRequest('Code utilisateur non valide !'));
    }

    if(!household){
      return next(Boom.badRequest('Code famille non valide !'));
    }

    let otherHousehold = await Household.findOne({ householdCode: user.householdCode });

    let notificationExist = await Notification.findOne(
      {$or : 
        [
          {type: "invitation-household-to-user", userId: user._id},
          {type: "invitation-user-to-household", userId: user._id},
          {type: "need-switch-admin", userId: user._id}
        ]
      });

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
      notificationObject.senderUserId = req.user._id
      notificationObject.message = `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
      notificationObject = {...notificationObject, ...{fullname: `${user.firstname} ${user.lastname}`,senderUserCode: user.usercode}};
    }

    let notification = await new Notification(notificationObject);
    await notification.save();

    socketIoEmit(notificationObject.userId, [{name : "updateNotificationReceived", data: notification}]);

    let notifWithPopulate = await Notification.findById(notification._id)
    .populate({
      path: 'userId',
      select: 'firstname lastname -_id'
    });

    socketIoEmit(req.user._id, [{name : "updateNotificationSended", data: notifWithPopulate}]);

    return res.status(204).send();
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

      if (notification.otherUserId && user.role === "admin" && oldMemberArray.length > 1) {
        let newNotification = await new Notification({
          message: "L'administrateur a accepté votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droits d'administration à un autre membre de votre famille.",
          householdId: newHousehold._id,
          userId: user._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();

        socketIoEmit(user._id, [{name : "updateNotificationReceived", data: newNotification}]);

        socketIoEmit(notification.userId, [{name : "deleteNotificationReceived", data: req.params.notificationId}]);
        
        return res.json({notificationsReceived : arrayNotificationsTransformed});
      }

      let indexMember = oldMemberArray.findIndex(obj => obj.usercode === user.usercode);

      if (oldHousehold) {
        newMemberArray.push(oldMemberArray[indexMember]);
      } else {
        let objectMember = await Helpers.createObjectMember(user);
        newMemberArray.push(objectMember);
      }

      let updatedNewHousehold = await Household.findByIdAndUpdate(newHousehold._id, { member: newMemberArray }, { override: true, upsert: true, new: true });

      let updatedOldHousehold;
      if (user.role === "user") {
        user = await User.findByIdAndUpdate(user._id, { householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        if (oldHousehold) {
          oldMemberArray.splice(indexMember, 1);
          updatedOldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { member: oldMemberArray }, { override: true, upsert: true, new: true });
        }

      }

      if (user.role === "admin" && oldMemberArray.length === 1) {
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

        oldMemberArray = [];
        await Household.findByIdAndUpdate(oldHousehold._id, { member: oldMemberArray }, { override: true, upsert: true, new: true });
      }

      let requestSwitchAdmin = {};
      if (user.role === "admin" && oldMemberArray.length > 1 && req.query.otherMember) {
        user = await User.findByIdAndUpdate(user._id, { role: "user", householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });

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

    socketIoEmit(notification.userId, [{name : "deleteNotificationReceived", data: req.params.notificationId}]);

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};