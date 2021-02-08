const Notification = require('./../models/notification.model'),
  Boom = require('@hapi/boom'),
  socketIo = require('./../../config/socket-io.config'),
  SocketIoModel = require('./../models/socketIo.model');

  const transformNotificationArray = (notificationArray) => {
    const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
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
    const notificationsSended = await Notification.find({ senderUserId: req.params.userId });
    
    let objectNotification ={
      notificationsReceived : transformNotificationArray(notificationsReceived),
      notificationsSended : transformNotificationArray(notificationsSended)
    }
    return res.json(objectNotification);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};