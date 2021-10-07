const sio = require('socket.io'),
      { loggerError } = require('./logger.config'),
      { env, environments } = require('./environment.config'),
      Product = require('./../api/models/product.model'),
      Historic = require('./../api/models/historic.model');
      Brand = require('./../api/models/brand.model'),
      { pageSize } = require('./../api/utils/globalVariable');

let io = null;

const initializeSocketIo = (httpServer, CorsOrigin) => {
  io = sio(httpServer, {
    cors:{
      origin: CorsOrigin
    }
  });
  io.on('connection', function(socket) {
    socket.on('enterSocketRoom', ({socketRoomName}) => {
      try {
        socket.join(socketRoomName);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`enterEditedRoom in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });

    socket.on('leaveSocketRoom', ({socketRoomName}) => {
      try {
        socket.leave(socketRoomName);
      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`leaveEditedRoom in socket-io.config error: ${error}`);
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

        let editProduct = true;
        if(isEdited && io.sockets.adapter.rooms.get(`${productId}-${type}Id`)){
          editProduct = false;
          io.to(`${productId}-${type}Id`).emit("kickProductIsEdited");
          io.socketsLeave(`${productId}-${type}Id`);
        }
        
        if(isEdited) socket.join(`${productId}-${type}Id`);

        if(editProduct && socket.rooms.has(`${productId}-${type}Id`)){
          await model.findByIdAndUpdate(productId, { isBeingEdited: isEdited });
          io.to(`${householdId}-${type}`).emit("productIsEdited", {productId : productId, isEdited: isEdited});
        }

        if(!isEdited && socket.rooms.has(`${productId}-${type}Id`)) socket.leave(`${productId}-${type}Id`);

      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`productIsEdited in socket-io.config error: ${error}`);
        }else{
          console.log(error);
        }
      }
    });

    socket.on('brandIsEdited', async ({householdId, brandId, isEdited}) => {
      try {
        if(!householdId || !brandId) return;
        if(typeof isEdited !== 'boolean') return;

        let editBrand = true;
        if(isEdited && io.sockets.adapter.rooms.get(`${brandId}-brandId`)){
          editBrand = false;
          io.to(`${brandId}-brandId`).emit("kickBrandIsEdited");
          io.socketsLeave(`${brandId}-brandId`);
        }
        
        if(isEdited) socket.join(`${brandId}-brandId`);

        if(editBrand && socket.rooms.has(`${brandId}-brandId`)){

          let userRoomNameArray = [];

          for (let key of io.sockets.adapter.rooms.keys()) {
            if (key.includes(`${householdId}-brand`)) {
              userRoomNameArray = [...userRoomNameArray, key];
              break;
            }
          }

          await Brand.findByIdAndUpdate(brandId, { isBeingEdited: isEdited });

          if(userRoomNameArray.length >= 1){
            let brands = await Brand.find({ householdId: householdId });
            brandIndex = brands.findIndex((brand) => brand._id.toString() === brandId.toString());

            for( userRoomName of userRoomNameArray ){
              let pageIndex = parseInt(userRoomName.split('-')[2]);
              if(brandIndex >= (pageIndex * pageSize) && brandIndex < (((pageIndex + 1 ) * pageSize))){
                io.to(userRoomName).emit("brandIsEdited", {brandId : brandId, isEdited: isEdited});
              }
            }
          }
        }

        if(!isEdited && socket.rooms.has(`${brandId}-brandId`)) socket.leave(`${brandId}-brandId`);

      } catch (error) {
        if(env.toUpperCase() === environments.PRODUCTION){
          loggerError.error(`brandIsEdited in socket-io.config error: ${error}`);
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
        if(key.includes('brandId')) {
          let brand = await Brand.findByIdAndUpdate(key.split('-')[0], { isBeingEdited: false });
          io.to(`${brand.householdId}-brand`).emit("brandIsEdited", {brandId : key.split('-')[0], isEdited: false});
        }
      }
    });
  });
}

const getSocketIoInstance = () => {
  return io;
}
module.exports = {initializeSocketIo, getSocketIoInstance}