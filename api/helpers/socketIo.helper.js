const socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model');

exports.socketIoEmit = async (userId, arrayEmitData) => {
  try {
    let socketIoDb = await SocketIoModel.findOne({ userId: userId });
    if(socketIoDb){
      const io = socketIo.getSocketIoInstance();
      arrayEmitData.forEach(emitData => {
        let data = emitData.data;
  
        if(emitData.name === "updateNotificationReceived" || emitData.name === "updateNotificationSended"){
          let fields = ['_id', 'message', 'fullName', 'senderUserCode', 'type', 'urlRequest', 'expirationDate'];
  
          if(emitData.name === "updateNotificationSended"){
            fields.push('userId')
          }

          const notificationTransform = {};
          fields.forEach((field)=>{
            notificationTransform[field] = emitData.data[field];
          });
          data = notificationTransform;
        }
        
        socketIoDb.socketId.forEach(socketId => {
          io.to(socketId).emit(emitData.name, data);
        });
  
      });
    }
    return;
  } catch (error) {
    return error;
  }

};