const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      Moment = require('moment-timezone'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      { transformArray, transformObject } = require('../helpers/transformJsonData.helper'),
      { transformInviteToNeedSwitchAdminNotif, transformNeedSwitchAdminToInviteNotif, injectHouseholdName, injectHouseholdNameInNotifArray } = require('../helpers/transformNotification.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper');
/**
* Switch familly and delegate admin request
*/
exports.switchAdminRequest = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) return next(Boom.notFound('Notification non trouvée!'));

    if(req.query.type){
      if (req.query.type !== "received") return next(Boom.badRequest('Paramètre de requête invalide!'));
    }

    if (notification.urlRequest !== 'delegate-admin') return next(Boom.badRequest('Mauvaise notification!'));

    if (!req.query.acceptedRequest) return next(Boom.badRequest("Besoin d'un paramètre de requête!"));
    
    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") return next(Boom.badRequest('Paramètre de requête invalide!'));

    let otherMember;
    if(req.query.otherMember){
      otherMember = await User.findById(req.query.otherMember);
      if (!otherMember) return next(Boom.notFound('Code utilisateur du/de la délégué.e non trouvé!'));
    }

    const household = await Household.findById(notification.householdId);
    let arrayMembers = household.members;
    if(req.query.acceptedRequest === "no" && !req.query.otherMember && notification.type === "request-delegate-admin"){
      const indexMember = arrayMembers.findIndex(member => member.isFlagged === false && member.userData.toString() !== notification.userId.toString());

      if (indexMember >= 0) {
        return next(Boom.badRequest("Un.e ou plusieurs autres membres sont encore éligibles pour la délégation des droits d'administrations!"));
      }
    }

    if(notification.type !== "last-chance-request-delegate-admin"){
      await Notification.findByIdAndDelete(notification._id);
    }
    
    let user;
    if (req.query.acceptedRequest === "yes") {
      const oldHousehold = await Household.findOne({ userId: notification.userId });
      if (oldHousehold) await Helpers.removeHousehold(oldHousehold._id);

      for (const member of arrayMembers) {
        if (member.isFlagged === true) member.isFlagged = false;

        if (notification.type === "last-chance-request-delegate-admin") {
          await Notification.findOneAndDelete({ userId: member.userData, householdId: notification.householdId, type: "last-chance-request-delegate-admin" });
        }
      }

      user = await User.findByIdAndUpdate(notification.userId, { role: "admin" });
      
      arrayMembers.sort((a, member)=>{ if(member.userData.toString() === notification.userId.toString()) return 1;});

      const updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { userId: notification.userId, isWaiting: false, members: arrayMembers, $unset: { lastChance: "" } })
      .populate({
        path: 'members.userData',
        select: 'firstname lastname usercode role'
      });

      if(updatedHousehold.members.length > 1){
        await transformInviteToNeedSwitchAdminNotif(user._id);
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

      const newAdminNotificationsReceived = await Notification.find(
        {$or : 
          [
            {userId : notification.userId},
            { householdId : household._id, type: "invitation-user-to-household" },
            { householdId : household._id, type: "information", userId: { $exists: false } },
          ]
        }
      );

      socketIoEmit(notification.userId, 
        [
          {name : "updateUserAndFamillyData", data: {userData : user.transform(), householdData : updatedHousehold.transform()}},
          {name : "updateAllNotifications", data: {notificationsReceived : transformArray(newAdminNotificationsReceived, "notification"), notificationsSended : transformArray(newAdminNotificationsSended, "notificationUserId")}}
        ]
      );

      for (const member of arrayMembers){
        if(member.userData.toString() !== user._id.toString()){
          socketIoEmit(member.userData, [{name : "updateFamilly", data: updatedHousehold.transform()}]);
        }
      }
    }
    if (req.query.acceptedRequest === "no") {
      user = await User.findById(notification.userId);
      if (notification.type === "request-delegate-admin") {
        if (req.query.otherMember) {
          const indexMember = arrayMembers.findIndex(member => member.userData.toString() === user._id.toString());
          arrayMembers[indexMember].isFlagged = true;
          const updatedHousehold = await Household.findByIdAndUpdate(notification.householdId, { members: arrayMembers })
          .populate({
            path: 'members.userData',
            select: 'firstname lastname usercode role'
          });

          socketIoEmit(user._id, [{name : "updateFamilly", data: updatedHousehold.transform()}]);

          let newNotification = await new Notification({
            message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'ancien.ne administrateur.trice, acceptez-vous cette requête ou passez l'administration à un.e autre membre de votre famille. Attention si vous êtes le/la dernier.ère membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée!",
            householdId: notification.householdId,
            userId: otherMember._id,
            type: "request-delegate-admin",
            urlRequest: "delegate-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
          });
          await newNotification.save();

          socketIoEmit(otherMember._id, 
            [
              {name : "updateFamilly", data: updatedHousehold.transform()},
              {name : "updateNotificationReceived", data: newNotification.transform()}
            ]
          );
        }
        if (!req.query.otherMember) await Helpers.noMoreAdmin(arrayMembers, household._id);
        socketIoEmit(notification.userId, [{ name : "deleteNotificationReceived", data: notification._id }]);
      }

      if(notification.type === "last-chance-request-delegate-admin"){
        await Notification.findByIdAndDelete(notification._id);
        socketIoEmit(notification.userId, [{ name : "deleteNotificationReceived", data: notification._id }]);
        
        const otherLastChanceNotifExist = await Notification.find({householdId : household._id, type : "last-chance-request-delegate-admin"});

        if(otherLastChanceNotifExist.length === 0) await Helpers.noMoreAdmin(arrayMembers, household._id);
      }
    }

    let finalObject = [];
    if(req.query.type === "received"){
      finalObject = await FindByQueryHelper.finalObjectNotifReceivedList(req, req.user, Notification);
    }

    if(!req.query.type){
      return res.status(204).send();
    }else{
      return res.json(finalObject);
    }

  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* Switch Admin rights
*/
exports.switchAdminRights = async (req, res, next) => {
  try {
    const household = await Household.findById(req.body.householdId);
    if(!household) return next(Boom.notFound("Cette famille n'existe pas!"));

    let searchNotification = await Notification.findOne({$or : 
      [
        {householdId : req.body.householdId, type: "request-admin"},
        {householdId : req.body.householdId, type: "need-switch-admin"},
      ]
    });
    if(searchNotification) return next(Boom.badRequest('Vous avez déjà une demande de délégation de droits administrateurs en attente! Supprimez votre ancienne demande pour pouvoir en effectuer une nouvelle.'));

    const user = await User.findById(req.body.userId);
    if(!user) return next(Boom.notFound("Cet.te utilisateur.trice n'existe pas!"));
    
    let notification = await new Notification({
      message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'administrateur.trice actuel.le, acceptez-vous cette requête?",
      householdId: req.body.householdId,
      userId: req.body.userId,
      senderUserId: req.user._id,
      type: "request-admin",
      urlRequest: "switch-admin-rights-respond",
    });
    await notification.save();
    socketIoEmit(req.body.userId, [{name : "updateNotificationReceived", data: notification.transform()}]);

    const notifWithPopulate = await Notification.findById(notification._id)
    .populate({
      path: 'userId',
      select: 'firstname lastname -_id'
    });

    socketIoEmit(req.user._id, [{name : "updateNotificationSended", data: notifWithPopulate.transform({withUserId : true})}]);

    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* Switch Admin rights Respond
*/
exports.switchAdminRightsRespond = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if(!notification) return next(Boom.notFound('Notification non trouvée!'));

    if(req.query.type){
      if (req.query.type !== "received") return next(Boom.badRequest('Paramètre de requête invalide!'));
    }

    if(notification.urlRequest !== 'switch-admin-rights-respond') return next(Boom.badRequest('Mauvaise notification!'));

    if (!req.query.acceptedRequest) return next(Boom.badRequest("Besoin d'un paramètre de requête!"));

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") return next(Boom.badRequest('Paramètre de requête invalide!'));

    await Notification.findByIdAndDelete(notification._id);

    if (req.query.acceptedRequest === "yes") {
      let household = await Household.findById(notification.householdId);
      const oldAdmin = await User.findByIdAndUpdate(household.userId, {role : "user"});
      const newAdmin = await User.findByIdAndUpdate(notification.userId, {role : "admin"});

      let arrayMembers = household.members;
      arrayMembers.sort((a, member)=>{ if(member.userData.toString() === newAdmin._id.toString()) return 1;});

      await transformNeedSwitchAdminToInviteNotif(oldAdmin._id);
      await transformInviteToNeedSwitchAdminNotif(newAdmin._id);

      household = await Household.findByIdAndUpdate(notification.householdId, {userId : notification.userId, members : arrayMembers})
      .populate({
        path: 'members.userData',
        select: 'firstname lastname usercode role'
      });
      
      let oldAdminNotificationsReceived = await Notification.find({userId : oldAdmin._id})
      .populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      oldAdminNotificationsReceived = injectHouseholdNameInNotifArray(oldAdminNotificationsReceived, "invitation-household-to-user");

      const oldAdminNotificationsSended = await Notification.find({senderUserId: oldAdmin._id})
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });

      socketIoEmit(oldAdmin._id, 
        [
          {name : "updateUserAndFamillyData", data: {userData : oldAdmin.transform(), householdData : household.transform()}},
          {name : "updateAllNotifications", data: {notificationsReceived : transformArray(oldAdminNotificationsReceived, "notificationHouseholdId"), notificationsSended : transformArray(oldAdminNotificationsSended, "notificationUserId")}},
        ]
      );

      for (const member of household.members){
        if(member.userData.toString() !== oldAdmin._id.toString() && member.userData.toString() !== notification.userId.toString()){
          socketIoEmit(member.userData, [{name : "updateFamilly", data: household}]);
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

      let newAdminNotificationsReceived = await Notification.find(
        {$or : 
          [
            {userId : notification.userId},
            { householdId : household._id, type: "invitation-user-to-household" },
            { householdId : household._id, type: "information", userId: { $exists: false } },
          ]
        }
      ).populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      newAdminNotificationsReceived = injectHouseholdNameInNotifArray(newAdminNotificationsReceived, "need-switch-admin");

      socketIoEmit(notification.userId, 
        [
          {name : "updateUserAndFamillyData", data: {userData : newAdmin.transform(), householdData : household.transform()}},
          {name : "updateAllNotifications", data: {notificationsReceived : transformArray(newAdminNotificationsReceived, "notificationHouseholdId"), notificationsSended : transformArray(newAdminNotificationsSended, "notificationUserId")}},
        ]
      );
    }

    if(req.query.acceptedRequest === "no"){
      const user = await User.findById(notification.userId);
      let newNotification = await new Notification({
        message: `L'utilisateur.trice ${user.firstname} ${user.lastname} n'a pas accepté.e votre requête de délégation de droit d'administration!`,
        type: 'information',
        householdId: notification.householdId,
      });
      await newNotification.save();

      socketIoEmit(notification.senderUserId, [
        { name : "deleteNotificationSended", data: notification._id }, 
        { name : "updateNotificationReceived", data: newNotification.transform() }
      ]);
      socketIoEmit(notification.userId, [{ name : "deleteNotificationReceived", data: notification._id }]);
    }

    let finalObject = [];
    if(req.query.type === "received"){
      finalObject = await FindByQueryHelper.finalObjectNotifReceivedList(req, req.user, Notification);
    }

    if(!req.query.type){
      return res.status(204).send();
    }else{
      return res.json(finalObject);
    }

  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* Add User request
*/
exports.addUserRequest = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.body.householdCode });
    const user = await User.findOne({ usercode: req.body.usercode });

    if(!user) return next(Boom.badRequest('Code utilisateur non valide!'));

    if(!household) return next(Boom.badRequest('Code famille non valide!'));

    if(household.isWaiting) return next(Boom.badRequest("Vous ne pouvez pas envoyer une requête d'invitation à cette famille car elle n'a, en ce moment, pas d'administrateur.trice!"));

    const otherHousehold = await Household.findById(user.householdId);

    const notificationExist = await Notification.findOne(
      {$or : 
        [
          {type: "invitation-household-to-user", userId: user._id, householdId: household._id},
          {type: "invitation-user-to-household", senderUserId: user._id, householdId: household._id},
          {type: "need-switch-admin", userId: user._id, householdId: household._id}
        ]
      });

    if(notificationExist){
      let errorMessage = "";
      if(req.body.type === "userToHousehold") errorMessage = "Vous avez déjà envoyé ou reçu une invitation de cette famille!";
      if(req.body.type === "householdToUser") errorMessage = "Vous avez déjà envoyé ou reçu une invitation de cette personne!";
      return next(Boom.badRequest(errorMessage));
    }

    if(user.householdId && user.householdId.toString() === household._id.toString()) return next(Boom.badRequest('Le membre fait déjà partie de cette famille !'));

    if (otherHousehold && otherHousehold.isWaiting === true) return next(Boom.badRequest("L'utilisateur.trice ne peut pas changer de famille en ce moment, car cette dernière n'a pas d'administrateur.trice!"));

    let notificationObject = {
      householdId: household._id,
      urlRequest: "add-user-respond",
    };

    if (req.body.type === "householdToUser") {
      const householdSender = await Household.findById(user.householdId);
      if(user.role === "user" || (user.role === "admin" && householdSender.members.length === 1)){
        notificationObject.type = "invitation-household-to-user";
        notificationObject.message = `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`;
      }
      if(user.role === "admin" && householdSender.members.length > 1){
        notificationObject.message = `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`;
        notificationObject.type = "need-switch-admin";
      }
      notificationObject.userId = user._id;
    }

    if (req.body.type === "userToHousehold") {
      notificationObject.type = "invitation-user-to-household";
      notificationObject.senderUserId = req.user._id;
      notificationObject.message = `L'utilisateur.trice ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`;
    }

    let notification = await new Notification(notificationObject);
    await notification.save();

    notification = await Notification.findById(notification._id)
    .populate({
      path: 'householdId',
      select: 'householdName -_id'
    });

    if(req.body.type === "userToHousehold") notification = notification.transform();
    if(req.body.type === "householdToUser") notification = injectHouseholdName(notification.transform({withHouseholdId : true}));

    let idUser;
    notification.type !== "invitation-user-to-household" ? idUser = notificationObject.userId : idUser = household.userId;
    socketIoEmit(idUser, [{name : "updateNotificationReceived", data: notification}]);
    
    let notificationSended;
    if(req.body.type === "userToHousehold"){
      notificationSended = await Notification.findById(notification._id).lean();
      let otherHousehold = await Household.findById(notificationSended.householdId)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });
      notificationSended.userId = { firstname: otherHousehold.userId.firstname, lastname: otherHousehold.userId.lastname };
    }
    if(req.body.type ==="householdToUser"){
      notificationSended = await Notification.findById(notification._id)
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        });
    }
    socketIoEmit(req.user._id, [{name : "updateNotificationSended", data: transformObject(notificationSended, 'notification')}]); 

    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* Add User respond
*/
exports.addUserRespond = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if(!notification) return next(Boom.notFound('Notification non trouvée!'));

    if(notification.urlRequest !== 'add-user-respond') return next(Boom.badRequest('Mauvaise notification!'));

    if (!req.query.acceptedRequest) return next(Boom.badRequest("Besoin d'un paramètre de requête!"));

    if (req.query.acceptedRequest !== "yes" && req.query.acceptedRequest !== "no") return next(Boom.badRequest('Paramètre de requête invalide!'));

    if(req.query.type){
      if (req.query.type !== "received") return next(Boom.badRequest('Paramètre de requête invalide!'));
    }
    
    if(notification.type === "need-switch-admin"){
      const notificationRequestAdmin = await Notification.findOne({type: "request-admin", senderUserId : req.user._id});
      if(notificationRequestAdmin) return next(Boom.badRequest("Vous ne pouvez pas déléguer vos droits d'administrations si une autre requête de délégation de droits est en cour!"));
    }

    const oldNotification = await Notification.findByIdAndDelete(notification._id);

    if(oldNotification.senderUserId) socketIoEmit(oldNotification.senderUserId, [{name : "deleteNotificationSended", data: oldNotification._id}]);
    
    if (oldNotification.householdId){
      const household = await Household.findById(oldNotification.householdId);
      socketIoEmit(household.userId, [{name : "deleteNotificationSended", data: oldNotification._id}]);
    }

    const newHousehold = await Household.findById(notification.householdId);
    let user;

    if (notification.type === "invitation-user-to-household") user = await User.findById(notification.senderUserId);
    if (notification.type === "invitation-household-to-user" || notification.type === "need-switch-admin") user = await User.findById(notification.userId);

    if (req.query.acceptedRequest === "yes") {
      
      const oldHousehold = await Household.findById(user.householdId);
      let oldMembersArray = [];
      if (oldHousehold) oldMembersArray = oldHousehold.members;

      if (notification.type === "invitation-user-to-household" && user.role === "admin" && oldMembersArray.length > 1) {
        let newNotification = await new Notification({
          message: "L'administrateur.trice de la famille {householdName} a accepté.e votre demande pour rejoindre sa famille, mais avant cela, il faut déléguer vos droits d'administration à un.e autre membre de votre famille.",
          householdId: newHousehold._id,
          userId: user._id,
          type: "need-switch-admin",
          urlRequest: "add-user-respond"
        });
        await newNotification.save();

        newNotification = await Notification.findById(newNotification._id)
        .populate({
          path: 'householdId',
          select: 'householdName -_id'
        });

        socketIoEmit(user._id, [{name : "updateNotificationReceived", data: injectHouseholdName(newNotification.transform({withHouseholdId : true}))}]);

        socketIoEmit(newHousehold.userId, [{name : "deleteNotificationReceived", data: req.params.notificationId}]);

        return res.status(204).send();
      }

      let newMembersArray = newHousehold.members;
      if(newMembersArray.length === 1){
        await transformInviteToNeedSwitchAdminNotif(newHousehold.userId);
      }

      let indexMember = oldMembersArray.findIndex(member => member.userData.toString() === user._id.toString());

      if (oldHousehold) newMembersArray = [...newMembersArray, oldMembersArray[indexMember]];
      if(!oldHousehold) newMembersArray = [...newMembersArray, {userData: user._id,isFlagged: false}];

      let updatedOldHousehold;
      if (user.role === "user") {
        if (oldHousehold) {
          oldMembersArray.splice(indexMember, 1);
          updatedOldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { members: oldMembersArray })
          .populate({
            path: 'members.userData',
            select: 'firstname lastname usercode role'
          });
        }
      }

      if (user.role === "admin" && oldMembersArray.length === 1) {
        oldMembersArray = [];
        await Household.findByIdAndUpdate(oldHousehold._id, { members: oldMembersArray });
      }

      if (user.role === "admin" && oldMembersArray.length > 1 && req.query.otherMember) {
        const requestSwitchAdmin = await Helpers.requestSwitchAdmin(user._id, req.query.otherMember);
        if (requestSwitchAdmin) {
          return next(requestSwitchAdmin);
        }
      }
      
      if(user.role === "admin" && oldMembersArray.length > 1 && !req.query.otherMember){
        oldMembersArray.splice(indexMember, 1);
        await Helpers.noMoreAdmin(oldMembersArray, oldHousehold._id);
      }

      const updatedUser = await User.findByIdAndUpdate(user._id, { role: "user", householdId: newHousehold._id });

      const updatedNewHousehold = await Household.findByIdAndUpdate(newHousehold._id, { members: newMembersArray })
      .populate({
        path: 'members.userData',
        select: 'firstname lastname usercode role'
      });
    
      if(user.role === "user") socketIoEmit(user._id, [{name : "updateUserAndFamillyData", data: {userData : updatedUser.transform(), householdData : updatedNewHousehold.transform()}}]);

      if(user.role === "admin"){
        await transformNeedSwitchAdminToInviteNotif(user._id);
        let userNotificationsReceived = await Notification.find({userId : user._id})
        .populate({
          path: 'householdId',
          select: 'householdName -_id'
        });

        userNotificationsReceived = injectHouseholdNameInNotifArray(userNotificationsReceived);

        socketIoEmit(user._id, 
          [
              {name : "updateUserAndFamillyData", data: {userData : updatedUser.transform(), householdData : updatedNewHousehold.transform()}},
              {name : "updateAllNotificationsReceived", data: transformArray(userNotificationsReceived, "notificationHouseholdId")},
          ]
        );
      }

      for (const member of updatedNewHousehold.members){
        if(member.userData._id.toString() !== user._id.toString()){
          if(member.userData._id.toString() !== updatedNewHousehold.userId.toString()){
            socketIoEmit(member.userData._id, [{name : "updateFamilly", data: updatedNewHousehold.transform()}]);
          }else{
            socketIoEmit(member.userData._id, [
              {name : "updateFamilly", data: updatedNewHousehold.transform()},
              {name : "deleteNotificationSended", data: req.params.notificationId},
            ]);
          }
        }
      }

      if(updatedOldHousehold){
        for (const member of updatedOldHousehold.members){
          socketIoEmit(member.userData._id, [{name : "updateFamilly", data: updatedOldHousehold.transform()}]);
        }
      }
      
    }

    if(req.query.acceptedRequest === "no"){
      let notificationObject = {
        message: "",
        type: "information",
        householdId: newHousehold._id
      }
      let userId;

      if(notification.type === "invitation-user-to-household"){
        userId = user._id;
        notificationObject.message = `L'administrateur.trice de la famille {householdName} n'a pas accepté.e votre requête d'invitation!`;
        notificationObject.userId = user._id;
      }
      if(notification.type === "invitation-household-to-user" || notification.type === "need-switch-admin"){
        userId = newHousehold.userId;
        notificationObject.message = `L'utilisateur.trice ${user.firstname} ${user.lastname} n'a pas accepté.e votre requête d'invitation!`;
      }

      let newNotification = await new Notification(notificationObject);
      await newNotification.save();

      newNotification = await Notification.findById(newNotification._id)
        .populate({
          path: 'householdId',
          select: 'householdName -_id'
        });


      socketIoEmit(userId, [{name : "updateNotificationReceived", data: injectHouseholdName(newNotification.transform({withHouseholdId: true}))}]);
    }

    let idUser;
    notification.type !== "invitation-user-to-household" ? idUser = notification.userId : idUser = newHousehold.userId;
    socketIoEmit(idUser, [{name : "deleteNotificationReceived", data: req.params.notificationId}]);

    let finalObject = [];
    if(req.query.type === "received"){
      finalObject = await FindByQueryHelper.finalObjectNotifReceivedList(req, req.user, Notification);
    }

    if(!req.query.type){
      return res.status(204).send();
    }else{
      return res.json(finalObject);
    }

  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};