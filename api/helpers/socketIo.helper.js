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
    }
  }

  return userRoomNameArray;
}

const sendNotifToSocket = async ({ userId, notificationId, type, addedNotif }) => {
  let includesType = `${userId}-notificationReceived`;
  if (type === "sended") includesType = `${userId}-notificationSended`;

  let userRoomNameArray = findSocketRoom({includesType});

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
      let finalObject = "finalObjectNotifReceivedList";
      if(type === "sended") finalObject = "finalObjectNotifSendedList";
      if(notificationId){
        if(notificationIndex >= (pageIndex * 12) && notificationIndex < (((pageIndex + 1 ) * 12))){
          let updatedNotifByType = await FindByQueryHelper[finalObject](pageIndex, user, Notification, addedNotif ? null : notificationId);
          socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
        }else{
          let currentPageIndex = notificationIndex === 0 ? 0 : Math.ceil(notificationIndex/12) - 1;
          let roomNamePageIndex = userRoomName.split('-')[2];

          if(roomNamePageIndex > currentPageIndex){
            let updatedNotifByType = await FindByQueryHelper[finalObject](pageIndex, user, Notification, addedNotif ? null : notificationId);
            socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
          }else{
            if(notificationId){
              if(type === "received"){
                findObject = {_id: {$ne: notificationId},  userId: user._id };

                if(user.role === "admin"){
                  findObject = {$and : [
                    { _id: {$ne: notificationId} },
                    {$or : 
                      [
                        { userId: user._id },
                        { householdId : user.householdId, type: "invitation-user-to-household" },
                        { householdId : user.householdId, type: "information", userId: { $exists: false } },
                      ]
                    }
                  ]};
                }
              }
              if(type === "sended"){
                findObject = {_id: {$ne: notificationId},  senderUserId: user._id };

                if(user.role === "admin"){
                  findObject = {$and : [
                    { _id: {$ne: notificationId} },
                    {$or : 
                      [
                        { senderUserId: user._id },
                        { householdId : user.householdId, type: "invitation-household-to-user" },
                        { householdId : user.householdId, type: "need-switch-admin" }
                      ]
                    }
                  ]};
                }
              }
            } 
            let totalNotif = await Notification.countDocuments(findObject);
            socketIoTo(userRoomName, "updatePageCount", {totalNotif});
          }
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

const socketIoToLogic = async ({ data, type, model, includesType, finalObject }) => {
  const { householdId } = data;
  let userRoomNameArray = findSocketRoom(includesType);

  if(userRoomNameArray.length >= 1){
    if(type !== "deleteAll"){
      let dataArray = await model.find({ householdId: householdId })
      .sort({createdAt : -1});
  
      dataIndex = dataArray.findIndex((dataLoop) => dataLoop._id.toString() === data._id.toString());
    }

    for( userRoomName of userRoomNameArray ){
      if(type === "deleteAll"){
        socketIoTo(userRoomName, "updateDataArray", {arrayData : [], totalData : 0});
        return;
      }
      let pageIndex = parseInt(userRoomName.split('-')[2]);
      if(dataIndex >= (pageIndex * 12) && dataIndex < (((pageIndex + 1 ) * 12))){
        if(type === "updatedData") socketIoTo(userRoomName, "updatedData", data.transform());
        if(type === "addedData") socketIoTo(userRoomName, "addedData", data.transform());
        if(type === "deletedData"){
          let newDataArray = await FindByQueryHelper[finalObject](pageIndex, householdId, model, data._id);
          socketIoTo(userRoomName, "updateDataArray", newDataArray);
        }
      }else{
        let currentPageIndex = dataIndex === 0 ? 0 : Math.ceil(dataIndex/12) - 1;
        let roomNamePageIndex = userRoomName.split('-')[2];

        if(roomNamePageIndex > currentPageIndex){
          if(type !== "updatedData"){
            let newDataArray = await FindByQueryHelper[finalObject](pageIndex, householdId, model, type === "deletedData" ? data._id : null);
            socketIoTo(userRoomName, "updateDataArray", newDataArray);
          }
        }else{
          if(type !== "updatedData"){
            let findObject = { householdId: householdId };
            if(type === "deletedData") findObject = {_id: {$ne: data._id},  householdId: householdId };
            let totalData = await model.countDocuments(findObject);
            socketIoTo(userRoomName, "updatePageCount", {totalData});
          }
        }
      }
    }
  }
  return;
};

const socketIoToBrand = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}-brand`};
  let finalObject = "finalObjectBrandList";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

const socketIoToShoppingList = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}-shoppingList`};
  let finalObject = "finalObjectShoppingList";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

const socketIoToProductLog = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}-productLog`};
  let finalObject = "finalObjectProductLog";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

module.exports = { 
  socketIoEmit, 
  socketIoTo, 
  sendNotifToSocket, 
  socketIoToBrand,
  socketIoToShoppingList,
  socketIoToProductLog
};