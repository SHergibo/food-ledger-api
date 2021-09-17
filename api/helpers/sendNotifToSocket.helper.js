const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      { socketIoTo } = require('./socketIo.helper'),
      FindByQueryHelper = require('./findByQueryParams.helper'),
      { getSocketIoInstance } = require('./../../config/socket-io.config');

exports.sendNotifToSocket = async ({ userId, notificationId, type, addedNotif }) => {
  const io = getSocketIoInstance();
  let socketRooms = io.sockets.adapter.rooms;

  let userRoomNameArray = [];
  let includesType = `${userId}-notificationReceived`;
  if (type === "sended") includesType = `${userId}-notificationSended`;

  for (let key of socketRooms.keys()) {
    if (key.includes(includesType)) {
      userRoomNameArray = [...userRoomNameArray, key];
      break;
    }
  }

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