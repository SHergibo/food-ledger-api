const Notification = require('./../models/notification.model'),
      Boom = require('@hapi/boom'),
      socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model');

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
    const notificationsReceived = await Notification.find({ userId: req.params.userId });
    const notificationsSended = await Notification.find({ senderUserId: req.params.userId })
    .populate({
      path: 'userId',
      select: 'firstname lastname -_id'
    })
    
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
    console.log(notification);

    let socketIoNotifUser = await SocketIoModel.findOne({ userId: notification.userId });
    if(socketIoNotifUser){
      const io = socketIo.getSocketIoInstance();
      io.to(socketIoNotifUser.socketId).emit("deleteNotificationReceived", notification._id);
    }

    return res.json(notification);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};