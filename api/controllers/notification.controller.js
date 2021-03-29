const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      Boom = require('@hapi/boom'),
      { socketIoEmit } = require('./../helpers/socketIo.helper');

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

/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const household = await Household.findOne({householdCode : user.householdCode});
    const notificationsReceived = await Notification.find({ userId: req.params.userId });
    let notificationsSended = [];

    if(user.role === "admin"){
      notificationsSended = await Notification.find(
      {$or : 
        [
          {senderUserId: req.params.userId},
          {householdId : household._id, type: "invitation-household-to-user"},
          {householdId : household._id, type: "need-switch-admin"}
        ]
      })
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });  
    }else if(user.role === "user"){
      notificationsSended= await Notification.find({senderUserId: req.params.userId})
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });
    } 
    
    let objectNotification ={
      notificationsReceived : transformNotificationArray(notificationsReceived),
      notificationsSended : transformNotificationArray(notificationsSended, true)
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
    const notification = await Notification.findByIdAndRemove(req.params.notificationId);

    socketIoEmit(notification.userId, [{name : "deleteNotificationReceived", data: notification._id}]);
    socketIoEmit(req.user._id, [{name : "deleteNotificationSended", data: notification._id}]);

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};