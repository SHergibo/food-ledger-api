const socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model');

exports.socketIoEmit = async (userId, arrayEmitData) => {
  let socketIoDb = await SocketIoModel.findOne({ userId: userId });
  if(socketIoDb){
    const io = socketIo.getSocketIoInstance();
    arrayEmitData.forEach(emitData => {
      let data = emitData.data;

      if(emitData.name === "notifSocketIo"){
        const fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
        const notificationTransform = {};
        fields.forEach((field)=>{
          notificationTransform[field] = emitData.data[field];
        });
        data = notificationTransform;
      }

      io.to(socketIoDb.socketId).emit(emitData.name, data);

    });
  }
  return;
};