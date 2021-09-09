const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      { socketIoEmit, socketIoTo } = require('./../helpers/socketIo.helper'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      { injectHouseholdNameInNotifArray } = require('./../helpers/transformNotification.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      socketIo = require('./../../config/socket-io.config');
      Boom = require('@hapi/boom');

/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    let notificationsReceived = [] 
    let notificationsSended = [];

    let notificationsSendedLeaned = await Notification.find({senderUserId: req.params.userId}).lean();
    for(let notif of notificationsSendedLeaned){
      let otherHousehold = await Household.findById(notif.householdId)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });
      notif.userId = { firstname: otherHousehold.userId.firstname, lastname: otherHousehold.userId.lastname };
    }

    if(user.role === "admin"){
      notificationsReceived = await Notification.find({$or : 
        [
          { userId: req.params.userId },
          { householdId : user.householdId, type: "invitation-user-to-household" },
          { householdId : user.householdId, type: "information", userId: { $exists: false } },
        ]
      }).populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);

      let notificationsSendedPopulated = await Notification.find(
      {$or : 
        [
          { householdId : user.householdId, type: "invitation-household-to-user" },
          { householdId : user.householdId, type: "need-switch-admin" }
        ]
      })
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });  
      notificationsSended = [...notificationsSendedPopulated, ...notificationsSendedLeaned];
    }else if(user.role === "user"){
      notificationsReceived = await Notification.find({ userId: req.params.userId })
      .populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
      notificationsSended = notificationsSendedLeaned;
    } 
    
    let objectNotification ={
      notificationsReceived : transformArray(notificationsReceived, 'notificationHouseholdId'),
      notificationsSended : transformArray(notificationsSended, 'notificationUserId')
    }
    return res.json(objectNotification);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET received notification list with pagination
*/
exports.findPaginateNotifReceived = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const finalObject = await FindByQueryHelper.finalObjectNotifReceivedList(req, user, Notification);
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET sended notification list with pagination
*/
exports.findPaginateNotifSended = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const finalObject = await FindByQueryHelper.finalObjectNotifSendedList(req, user, Notification);
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE notification
*/
exports.remove = async (req, res, next) => {
  try {
    // if (!req.query.type) return next(Boom.badRequest("Besoin d'un paramètre de requête!"));

    if (req.query.type !== "received" && req.query.type !== "sended") return next(Boom.badRequest('Paramètre de requête invalide!'));

    let notification = await Notification.findById(req.params.notificationId);
    if(notification.type === "request-delegate-admin") return next(Boom.forbidden('Vous ne pouvez pas supprimer cette notification!'));

    let idUser = notification.userId;;
    if(notification.type === "invitation-user-to-household"){
      const household = await Household.findById(notification.householdId);
      idUser = household.userId;
    }

    if(req.query.type === "sended"){
      const io = socketIo.getSocketIoInstance();
      let socketRooms = io.sockets.adapter.rooms;

      let userRoomName;

      for (let key of socketRooms.keys()) {
        if (key.includes(`${idUser}-notificationReceived`)) {
          userRoomName = key;
          break;
        }
      }

      if(userRoomName){
        let pageIndex = parseInt(userRoomName.split('-')[2]);
  
        let user = await User.findById(idUser);
        let findObject = { userId: user._id };
  
        if(user.role === "admin"){
          findObject = {$or : 
            [
              { userId: user._id },
              { householdId : user.householdId, type: "invitation-user-to-household" },
              { householdId : user.householdId, type: "information", userId: { $exists: false } },
            ]
          };
        }
  
        let allNotifReceived = await Notification.find(findObject);
        let indexNotifToDelete = allNotifReceived.findIndex((notif) => notif._id.toString() === notification._id.toString());
        await Notification.findByIdAndRemove(req.params.notificationId);

        if(indexNotifToDelete >= ((pageIndex * 12) - 12) && indexNotifToDelete < pageIndex * 12){
          let updatedNotifReceivedArray = await FindByQueryHelper.finalObjectNotifReceivedList(req, req.user, Notification);
          socketIoTo(userRoomName, "updateNotifArray", updatedNotifReceivedArray);
        }else{
          let totalNotifReceived = await Notification.countDocuments(findObject);
          socketIoTo(userRoomName, "updatePageCount", {totalNotifReceived});
        }
      }
    }

    if(req.query.type === "received"){
      await Notification.findByIdAndRemove(req.params.notificationId);
    }
    
    if(notification.type !== "information"){
      socketIoEmit(idUser, [{name : "deleteNotificationReceived", data: notification._id}]);
    }

    let socketIoEmitName = notification.type === "information" ? "deleteNotificationReceived" : "deleteNotificationSended";
    socketIoEmit(req.user._id, [{name : socketIoEmitName, data: notification._id}]);

    let finalObject = [];
    if(req.query.type === "received"){
      finalObject = await FindByQueryHelper.finalObjectNotifReceivedList(req, req.user, Notification);
    }

    if(req.query.type === "sended"){
      finalObject = await FindByQueryHelper.finalObjectNotifSendedList(req, req.user, Notification);
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