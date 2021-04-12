const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      Boom = require('@hapi/boom');

/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    let notificationsReceived = [] 
    let notificationsSended = [];

    if(user.role === "admin"){
      notificationsReceived = await Notification.find({$or : 
        [
          { userId: req.params.userId },
          { householdId : user.householdId, type: "invitation-user-to-household" },
          { householdId : user.householdId, type: "information" },
        ]
      });
      notificationsSended = await Notification.find(
      {$or : 
        [
          { senderUserId: req.params.userId },
          { householdId : user.householdId, type: "invitation-household-to-user" },
          { householdId : user.householdId, type: "need-switch-admin" }
        ]
      })
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });  
    }else if(user.role === "user"){
      notificationsReceived = await Notification.find({ userId: req.params.userId });
      notificationsSended = await Notification.find({senderUserId: req.params.userId}).lean();
      for(let notif of notificationsSended){
        let otherHousehold = await Household.findById(notif.householdId);
        let userData = otherHousehold.members.find(member => member.userData.toString() === otherHousehold.userId.toString());
        notif.userId = { firstname: userData.firstname, lastname: userData.lastname };
      }
    } 
    
    let objectNotification ={
      notificationsReceived : transformArray(notificationsReceived, 'notification'),
      notificationsSended : transformArray(notificationsSended, 'notificationUserId')
    }
    return res.json(objectNotification);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE notification
*/
exports.remove = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.notificationId);
    if(notification.type === "request-delegate-admin"){
      return next(Boom.forbidden('Vous ne pouvez pas supprimer cette notification!'));
    }

    const notificationDeleted = await Notification.findByIdAndRemove(req.params.notificationId);
    let idUser = notificationDeleted.userId;
    
    if(notificationDeleted.type === "invitation-user-to-household"){
      const household = await Household.findById(notificationDeleted.householdId);
      idUser = household.userId;
    }

    if(notificationDeleted.type !== "information"){
      socketIoEmit(idUser, [{name : "deleteNotificationReceived", data: notificationDeleted._id}]);
    }

    let socketIoEmitName = notificationDeleted.type === "information" ? "deleteNotificationReceived" : "deleteNotificationSended";
    socketIoEmit(req.user._id, [{name : socketIoEmitName, data: notificationDeleted._id}]);

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};