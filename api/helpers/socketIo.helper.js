const socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model');

exports.socketIoEmit = async (userId, arrayEmitData) => {
  try {
    let socketIoDb = await SocketIoModel.findOne({ userId: userId });
    if(socketIoDb){
      const io = socketIo.getSocketIoInstance();
      arrayEmitData.forEach(emitData => {
        let data = emitData.data;
  
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