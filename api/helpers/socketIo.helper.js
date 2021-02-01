const socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model');

exports.socketIoNotification = async (userId, emit, notification) => {
  let socketIoDb = await SocketIoModel.findOne({ userId: userId });
    if(socketIoDb){
      const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
      const notificationTransform = {};
      fields.forEach((field)=>{
        notificationTransform[field] = notification[field];
      });
      const io = socketIo.getSocketIoInstance();
      io.to(socketIoDb.socketId).emit(emit, notificationTransform);
    }
    return;
};