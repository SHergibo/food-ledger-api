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
      let notification = await new Notification({
        message: `Notification TEST!!!!`,
        fullName: `Jules Hergibo`,
        senderUserCode: "K-GVtq~ihf",
        householdId: "5f62238ca97d5a1003a7f0ec",
        userId: '5f62238ca97d5a1003a7f0ea',
        otherUserId: "5fb525fc8b8dba24965a6d94",
        type: "request-addUser",
        urlRequest: "add-user-respond"
      });
      await notification.save();

      const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
      const notificationTransform = {};
      fields.forEach((field)=>{
        notificationTransform[field] = notification[field];
      });


      const io = socketIo.getSocketIoInstance();
      //Nettoyer l'object notification comme à la ligne 14
      io.to(socketIoDb.socketId).emit("notifSocketIo", notificationTransform);
    }

    return res.send().status(200);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};