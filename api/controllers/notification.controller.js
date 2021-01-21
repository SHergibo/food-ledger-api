const Notification = require('./../models/notification.model'),
  Boom = require('@hapi/boom'),
  socketIo = require('./../../config/socket-io.config'),
  SocketIoModel = require('./../models/socketIo.model');


/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId });
    const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
    let arrayNotificationsTransformed = [];
    notifications.forEach((item) => {
      const object = {};
      fields.forEach((field) => {
        object[field] = item[field];
      });
      arrayNotificationsTransformed.push(object);
    });
    return res.json(arrayNotificationsTransformed);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

exports.testSocket = async (req, res, next) => {
  try {
    let socketIoDb = await SocketIoModel.findOne({ userId: req.params.userId });
    if(socketIoDb){
      const io = socketIo.getSocketIoInstance();
      io.to(socketIoDb.socketId).emit("notification", "Nouvelle notif!!!");
    }

    return res.send().status(200);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};