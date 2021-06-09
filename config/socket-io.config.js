const sio = require('socket.io'),
      { loggerError } = require('./logger.config'),
      { env, environments } = require('./environment.config'),
      Product = require('./../api/models/product.model'),
      Historic = require('./../api/models/historic.model');

let io = null;

const initializeSocketIo = (httpServer, CorsOrigin) => {
  io = sio(httpServer, {
    cors:{
      origin: CorsOrigin
    }
  });
  io.on('connection', function(socket) {
    socket.on('setUserRoom', ({userId}) => {
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
    socket.on('enterProductRoom', ({householdId, type}) => {
      try {
        socket.join(`${householdId}-${type}`);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`setProductRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('leaveProductRoom', ({householdId, type}) => {
      try {
        socket.leave(`${householdId}-${type}`);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`leaveProductRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('productIsEdited', async ({householdId, type, productId}) => {
      try {
        if(!type || !householdId || !productId) return;
        let model;
        if(type === "produit") model = Product;
        if(type === "historique") model = Historic;
        await model.findByIdAndUpdate(productId, { isBeingEdited: true });
        io.to(`${householdId}-${type}`).emit("productIsEdited", productId);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`productIsEdited in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('productIsNotEdited', async ({householdId, type, productId}) => {
      try {
        if(!type || !householdId || !productId) return;
        let model;
        if(type === "produit") model = Product;
        if(type === "historique") model = Historic;
        await model.findByIdAndUpdate(productId, { isBeingEdited: false });
        io.to(`${householdId}-${type}`).emit("productIsNotEdited", productId);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`productIsNotEdited in socket-io.config error: ${error}`);
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