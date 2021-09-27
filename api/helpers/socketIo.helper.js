const { getSocketIoInstance } = require('./../../config/socket-io.config'),
      Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      FindByQueryHelper = require('./findByQueryParams.helper');

const socketIoEmit = async (userId, arrayEmitData) => {
  try {
    const io = getSocketIoInstance();
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

const socketIoTo = async (roomName, emitName, data) => {
  try {
    const io = getSocketIoInstance();
    if(!roomName || !emitName || !data) return;
    io.to(roomName).emit(emitName, data);
    return;
  } catch (error) {
    return error;
  }
};

const findSocketRoom  = ({includesType}) => {
  const io = getSocketIoInstance();
  let socketRooms = io.sockets.adapter.rooms;

  let userRoomNameArray = [];

  for (let key of socketRooms.keys()) {
    if (key.includes(includesType)) {
      userRoomNameArray = [...userRoomNameArray, key];
      break;
    }
  }

  return userRoomNameArray;
}

const sendNotifToSocket = async ({ userId, notificationId, type, addedNotif }) => {
  // const io = getSocketIoInstance();
  // let socketRooms = io.sockets.adapter.rooms;

  let includesType = `${userId}-notificationReceived`;
  if (type === "sended") includesType = `${userId}-notificationSended`;

  let userRoomNameArray = findSocketRoom({includesType});

  // for (let key of socketRooms.keys()) {
  //   if (key.includes(includesType)) {
  //     userRoomNameArray = [...userRoomNameArray, key];
  //     break;
  //   }
  // }

  if(userRoomNameArray.length >= 1){
    let user = await User.findById(userId);
    let findObject;
    let notificationIndex;

    if(notificationId){

      if(type === "received"){      
        findObject = { userId: user._id };
    
        if(user.role === "admin"){
          findObject = {$or : 
            [
              { userId: user._id },
              { householdId : user.householdId, type: "invitation-user-to-household" },
              { householdId : user.householdId, type: "information", userId: { $exists: false } },
            ]
          };
        }
      }
  
      if(type === "sended"){
        findObject = { senderUserId: user._id };
    
        if(user.role === "admin"){
          findObject = {$or : 
            [
              { senderUserId: user._id },
              { householdId : user.householdId, type: "invitation-household-to-user" },
              { householdId : user.householdId, type: "need-switch-admin" }
            ]
          };
        }
      }

      let allNotifByType = await Notification.find(findObject);
      notificationIndex = allNotifByType.findIndex((notif) => notif._id.toString() === notificationId.toString());
    } 

    for( userRoomName of userRoomNameArray ){
      let pageIndex = parseInt(userRoomName.split('-')[2]);
      if(notificationId){
        if(notificationIndex >= (pageIndex * 12) && notificationIndex < (((pageIndex + 1 ) * 12))){
          let finalObject = "finalObjectNotifReceivedList";
          if(type === "sended") finalObject = "finalObjectNotifSendedList";
          let updatedNotifByType = await FindByQueryHelper[finalObject](pageIndex, user, Notification, addedNotif ? null : notificationId);
          socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
        }else{
          let totalNotif = await Notification.countDocuments(findObject);
          socketIoTo(userRoomName, "updatePageCount", {totalNotif});
        }
      }
      if(!notificationId){
        let finalObject = "finalObjectNotifReceivedList";
        if(type === "sended") finalObject = "finalObjectNotifSendedList";
        let updatedNotifByType = await FindByQueryHelper[finalObject](pageIndex, user, Notification);
        socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
      }
    }
  }
  return;
};

const socketIoToBrand = async ({ brandData, type }) => {
  const { householdId } = brandData;
  let userRoomNameArray = findSocketRoom({includesType : `${householdId}-brand`});

  if(userRoomNameArray.length >= 1){
    let brands = await Brand.find({ householdId: householdId });
    brandIndex = brands.findIndex((brand) => brand._id.toString() === brandData._id.toString());

    for( userRoomName of userRoomNameArray ){
      let pageIndex = parseInt(userRoomName.split('-')[2]);
      if(brandIndex >= (pageIndex * 12) && brandIndex < (((pageIndex + 1 ) * 12))){
        if(type === "updatedBrand") socketIoTo(userRoomName, "updatedBrand", brandData.transform());
        if(type === "addedBrand") socketIoTo(userRoomName, "addedBrand", brandData.transform());
        if(type === "deletedBrand"){
          let newBrandArray = await FindByQueryHelper.finalObjectBrandList(pageIndex, brandData.householdId, Brand, brandData._id);
          socketIoTo(userRoomName, "updateBrandArray", newBrandArray);
        }
      }else{
        // let totalNotif = await Notification.countDocuments(findObject);
        // socketIoTo(userRoomName, "updatePageCount", {totalNotif});
      }
    }
  }
}

module.exports = { 
  socketIoEmit, 
  socketIoTo, 
  sendNotifToSocket, 
  socketIoToBrand 
};