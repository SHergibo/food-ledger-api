const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      { socketIoEmit, sendNotifToSocket } = require('./../helpers/socketIo.helper'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      { injectHouseholdNameInNotifArray } = require('./../helpers/transformNotification.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      Boom = require('@hapi/boom');

/**
* GET all notifications
*/
exports.findAllReceivedNotif = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    let notificationsReceived = [] 

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

    }else if(user.role === "user"){
      notificationsReceived = await Notification.find({ userId: req.params.userId })
      .populate({
        path: 'householdId',
        select: 'householdName -_id'
      });

      notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
    } 
    
    return res.json(transformArray(notificationsReceived, 'notificationHouseholdId'));
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET all sended notifications
*/
exports.findAllSendedNotif = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
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
      notificationsSended = notificationsSendedLeaned;
    } 
    
    return res.json(transformArray(notificationsSended, 'notificationUserId'));
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET received notification list with pagination
*/
exports.findPaginateReceivedNotif = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const finalObject = await FindByQueryHelper.finalObjectNotifReceivedList({pageIndex : req.query.page, findByData : user, model : Notification});
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET sended notification list with pagination
*/
exports.findPaginateSendedNotif = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const finalObject = await FindByQueryHelper.finalObjectNotifSendedList({pageIndex : req.query.page, findByData : user, model : Notification});
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
    if(req.query.type){
      if (req.query.type !== "received" && req.query.type !== "sended") return next(Boom.badRequest('Paramètre de requête invalide!'));
    }

    let notification = await Notification.findById(req.params.notificationId);
    if(notification.type === "request-delegate-admin") return next(Boom.forbidden('Vous ne pouvez pas supprimer cette notification!'));

    let idUser = notification.userId;
    if(notification.type === "invitation-user-to-household" || notification.type === "information"){
      const household = await Household.findById(notification.householdId);
      idUser = household.userId;
    }

    if(req.query.type === "sended"){
      await sendNotifToSocket({userId : idUser, notificationId : notification._id, type : "received"});
      await sendNotifToSocket({userId : req.user._id, notificationId : notification._id, type : "sended"});
    }

    if(req.query.type === "received"){
      await sendNotifToSocket({userId : req.user._id, notificationId : notification._id, type : "received"});
    }

    if(req.query.type === "received" && !req.query.page){
      await sendNotifToSocket({userId : idUser, notificationId : notification._id, type : "received"});
    }

    await Notification.findByIdAndRemove(req.params.notificationId);
    
    let socketUserId = notification.type === "information" ? req.user._id : idUser;
    socketIoEmit(socketUserId, [{name : "deleteNotificationReceived", data: notification._id}]);

    let finalObject = [];
    if(req.query.type === "received" && req.query.page){
      finalObject = await FindByQueryHelper.finalObjectNotifReceivedList({pageIndex : req.query.page, findByData : req.user, model : Notification});
    }

    if(req.query.type === "sended" && req.query.page){
      finalObject = await FindByQueryHelper.finalObjectNotifSendedList({pageIndex : req.query.page, findByData : req.user, model : Notification});
    }

    if(!req.query.type && !req.query.page){
      return res.status(204).send();
    }else{
      return res.json(finalObject);
    }
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};