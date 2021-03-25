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
    socket.on('setSocketId', async ({userId, socketId, oldSocketId}) => {
      try {
        let socketIoDb = await SocketIoModel.findOne({userId : userId});
        if(socketIoDb){
          let arraySocketId = socketIoDb.socketId;
          const indexSocketId = arraySocketId.findIndex(socketId => socketId === oldSocketId);
          if(indexSocketId !== -1){
            arraySocketId[indexSocketId] = socketId;
          }else{
            arraySocketId.push(socketId);
          }
          await SocketIoModel.findByIdAndUpdate(socketIoDb._id, { socketId: arraySocketId }, { override: true, upsert: true, new: true });
        }else{
          const newSocketIoDb = new SocketIoModel({
            userId : userId,
            socketId: [socketId]
          });
          await newSocketIoDb.save();
        }
      } catch (error) {
        console.log(error);
      }
    });
  
    socket.on('disconnect', async () => {
      try {
        let socketIoDb = await SocketIoModel.findOne({socketId : socket.id});
        let arraySocketId = socketIoDb.socketId;
        if(arraySocketId.length > 1){
          const indexSocketId = arraySocketId.findIndex(socketId => socketId === socket.id); 
          arraySocketId.splice(indexSocketId, 1);
          await SocketIoModel.findByIdAndUpdate(socketIoDb._id, { socketId: arraySocketId }, { override: true, upsert: true, new: true });
        }else{
          await SocketIoModel.findOneAndDelete({
            socketId : socket.id,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
}

const getSocketIoInstance = () => {
  return io;
}
module.exports = {initializeSocketIo, getSocketIoInstance}