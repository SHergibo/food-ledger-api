const sio = require('socket.io'),
      { loggerError } = require('./logger.config'),
      { env, environments } = require('./environment.config');

let io = null;

const initializeSocketIo = (httpServer, CorsOrigin) => {
  io = sio(httpServer, {
    cors:{
      origin: CorsOrigin
    }
  });
  io.on('connection', function(socket) {
    socket.on('setUserRoom', async ({userId}) => {
      try {
        socket.join(userId);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`setUserRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('setProductRoom', async ({householdId, type}) => {
      try {
        socket.join(`${householdId}-${type}`);
        //console.log(io.sockets.adapter.rooms);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`setProductRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('productIsEdited', async ({householdId, type, productId}) => {
      try {
        io.to(`${householdId}-${type}`).emit("productIsEdited", productId);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`setProductRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('productIsNotEdited', async ({householdId, type, productId}) => {
      try {
        io.to(`${householdId}-${type}`).emit("productIsNotEdited", productId);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`setProductRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
  });
}

const getSocketIoInstance = () => {
  return io;
}
module.exports = {initializeSocketIo, getSocketIoInstance}