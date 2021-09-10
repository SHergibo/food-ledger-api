const Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      { socketIoTo } = require('./socketIo.helper'),
      FindByQueryHelper = require('./findByQueryParams.helper'),
      socketIo = require('./../../config/socket-io.config');

exports.sendNotifToSocket = async ({userId, notificationId, deleteNotif, type}) => {
  console.log(notificationId)
  const io = socketIo.getSocketIoInstance();
  let socketRooms = io.sockets.adapter.rooms;

  let userRoomName;
  let includesType = `${userId}-notificationReceived`;
  if (type === "sended") includesType = `${userId}-notificationSended`;

  console.log(includesType)
  
  for (let key of socketRooms.keys()) {
    if (key.includes(includesType)) {
      userRoomName = key;
      break;
    }
  }


  if(userRoomName){
    let pageIndex = parseInt(userRoomName.split('-')[2]);

    let user = await User.findById(userId);

    let findObject;
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
    let indexNotif = allNotifByType.findIndex((notif) => notif._id.toString() === notificationId.toString());

    if(deleteNotif){
      await Notification.findByIdAndRemove(notificationId);
    }

    if(indexNotif >= (pageIndex * 12) && indexNotif < (((pageIndex + 1 ) * 12))){
      let finalObject = "finalObjectNotifReceivedList";
      if(type === "sended") finalObject = "finalObjectNotifSendedList";
      console.log(finalObject)
      let updatedNotifByType = await FindByQueryHelper[finalObject](pageIndex, user, Notification);
      console.log(updatedNotifByType)
      console.log(userRoomName)
      socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
    }else{
      let totalNotif = await Notification.countDocuments(findObject);
      socketIoTo(userRoomName, "updatePageCount", {totalNotif});
    }
  }
  return;
};