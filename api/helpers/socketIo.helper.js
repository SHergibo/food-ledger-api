const socketIo = require('./../../config/socket-io.config');

exports.socketIoEmit = async (userId, arrayEmitData) => {
  try {
    const io = socketIo.getSocketIoInstance();
    let userConnected = io.sockets.adapter.rooms.get(userId.toString());
    if(userConnected){
      arrayEmitData.forEach(emitData => {
        let data = emitData.data;
        io.to(userId.toString()).emit(emitData.name, data);
      });
    }
    return;
  } catch (error) {
    return error;
  }
};