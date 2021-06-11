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
    socket.on('productIsEdited', async ({householdId, type, productId, isEdited}) => {
      try {
        if(!type || !householdId || !productId) return;
        if(typeof isEdited !== 'boolean') return;
        let model;
        if(type === "produit") model = Product;
        if(type === "historique") model = Historic;
        if(isEdited) socket.join(`${productId}-${type}Id`);
        if(!isEdited) socket.leave(`${productId}-${type}Id`);
        await model.findByIdAndUpdate(productId, { isBeingEdited: isEdited });
        io.to(`${householdId}-${type}`).emit("productIsEdited", {productId : productId, isEdited: isEdited});
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`productIsEdited in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });
    socket.on('disconnecting', async () => {
      for (const key of socket.rooms){
        if(key.includes('produitId') || key.includes('historiqueId')) {
          let model;
          let type;
          key.includes('produitId') ? model = Product : model = Historic;
          key.includes('produitId') ? type = "produit" : type = 'historique';
          let product = await model.findByIdAndUpdate(key.split('-')[0], { isBeingEdited: false });
          io.to(`${product.householdId}-${type}`).emit("productIsEdited", {productId : key.split('-')[0], isEdited: false});
        }
      }
    });
  });
}

const getSocketIoInstance = () => {
  return io;
}
module.exports = {initializeSocketIo, getSocketIoInstance}