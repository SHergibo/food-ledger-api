const sio = require('socket.io'),
      SocketIoModel = require('./../api/models/socketIo.model');

let io = null;

const initializeSocketIo = (httpServer, CorsOrigin) => {
  io = sio(httpServer, {
    cors:{
      origin: CorsOrigin
    }
  });
  io.on('connection', function(socket) {
    socket.on('setSocketId', async ({userId, socketId}) => {
      let socketIoDb = await SocketIoModel.findOne({userId : userId});
      if(socketIoDb){
        await SocketIoModel.findByIdAndUpdate(socketIoDb._id, { socketId: socketId }, { override: true, upsert: true, new: true });
      }else{
        const newSocketIoDb = new SocketIoModel({
          userId : userId,
          socketId: socketId
        });
        await newSocketIoDb.save();
      }
    });
  
    socket.on('disconnect', async () => {
      await SocketIoModel.findOneAndDelete({
        socketId : socket.id,
      });
    });
  });
}

const getSocketIoInstance = () => {
  return io;
}
module.exports = {initializeSocketIo, getSocketIoInstance}