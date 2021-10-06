const { getSocketIoInstance } = require('./../../config/socket-io.config'),
      Notification = require('./../models/notification.model'),
      User = require('./../models/user.model'),
      FindByQueryHelper = require('./findByQueryParams.helper'),
      { createFindAndSortObject }  = require('./createFindAndSortObject.helper');

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
      let pageIndex = parseInt(userRoomName.split('/')[2]);
      let finalObject = "finalObjectNotifReceivedList";
      if(type === "sended") finalObject = "finalObjectNotifSendedList";
      if(notificationId){
        if(notificationIndex >= (pageIndex * 12) && notificationIndex < (((pageIndex + 1 ) * 12))){
          let updatedNotifByType = await FindByQueryHelper[finalObject]({pageIndex, findById : user, model : Notification, dataId : addedNotif ? null : notificationId});
          socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
        }else{
          let currentPageIndex = notificationIndex === 0 ? 0 : Math.ceil(notificationIndex/12) - 1;
          let roomNamePageIndex = userRoomName.split('/')[2];

          if(roomNamePageIndex > currentPageIndex){
            let updatedNotifByType = await FindByQueryHelper[finalObject]({pageIndex, findById : user, model : Notification, dataId :  addedNotif ? null : notificationId});
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
        let updatedNotifByType = await FindByQueryHelper[finalObject]({pageIndex, findByData : user, model : Notification});
        socketIoTo(userRoomName, "updateNotifArray", updatedNotifByType);
      }
    }
  }
  return;
};

const findDataIndex = async({model, findObject, sortObject, data}) => {
  let dataArray = await model.find(findObject)
  .sort(sortObject);

  dataIndex = await dataArray.findIndex((dataLoop) => dataLoop._id.toString() === data._id.toString());
  return dataIndex;
};

const createSearchParams = async ({searchData, findObject, sortObject}) => {
  let objectSearchParams  = {};
  let searchDataArray = searchData.split('&');
  searchDataArray.shift();

  searchDataArray.forEach(data => {
    searchParams = data.split('=');
    objectSearchParams[searchParams[0]] = searchParams[1];
  });

  ({ findObject , sortObject } = await createFindAndSortObject({findObject, sortObject, queryParams : objectSearchParams}));

  return { findObject , sortObject }
}

const socketIoToLogic = async ({ data, type, model, includesType, finalObject, req }) => {
  const { householdId } = data;
  const userRoomNameArray = findSocketRoom(includesType);
  let dataIndex;

  if(userRoomNameArray.length >= 1){
    if(type !== "deleteAll" && !req){
      dataIndex = await findDataIndex({model, findObject : { householdId: householdId }, sortObject : {createdAt : -1}, data});
    }
    
    for( userRoomName of userRoomNameArray ){
      if(type === "deleteAll"){
        socketIoTo(userRoomName, "updateDataArray", {arrayData : [], totalData : 0});
        return;
      }
      
      if(req){
        let findObject = { householdId: householdId };
        let sortObject = {createdAt : -1}
        const searchData = userRoomName.split('/')[3];

        if(searchData){
         ({findObject, sortObject} = await createSearchParams({searchData, findObject, sortObject}));
        }

        dataIndex = await findDataIndex({model, findObject, sortObject, data});
      }

      let pageIndex = parseInt(userRoomName.split('/')[2]);
      if(dataIndex >= (pageIndex * 12) && dataIndex < (((pageIndex + 1 ) * 12))){
        if(type === "updatedData") socketIoTo(userRoomName, "updatedData", data.transform());
        if(type === "addedData") socketIoTo(userRoomName, "addedData", data.transform());
        if(type === "deletedData"){
          let newDataArray = await FindByQueryHelper[finalObject]({pageIndex, findByData : householdId, model, dataId : data._id, req});
          socketIoTo(userRoomName, "updateDataArray", newDataArray);
        }
      }else{
        let currentPageIndex = dataIndex === 0 ? 0 : Math.ceil(dataIndex/12) - 1;
        let roomNamePageIndex = userRoomName.split('/')[2];

        if(roomNamePageIndex > currentPageIndex){
          if(type !== "updatedData"){
            let newDataArray = await FindByQueryHelper[finalObject]({pageIndex, findByData : householdId, model, dataId : type === "deletedData" ? data._id : null, req});
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

const socketIoToProduct = async ({req, data, type, model, to }) => {
  let includesType = {includesType: `${data.householdId}/${to}`};
  let finalObject = "finalObject";
  await socketIoToLogic({ data, type, model, includesType, finalObject, req });
}

const socketIoToBrand = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}/brand`};
  let finalObject = "finalObjectBrandList";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

const socketIoToShoppingList = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}/shoppingList`};
  let finalObject = "finalObjectShoppingList";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

const socketIoToProductLog = async ({ data, type, model }) => {
  let includesType = {includesType: `${data.householdId}/productLog`};
  let finalObject = "finalObjectProductLog";
  await socketIoToLogic({ data, type, model, includesType, finalObject });
}

module.exports = { 
  socketIoEmit, 
  socketIoTo, 
  sendNotifToSocket,
  socketIoToProduct,
  socketIoToBrand,
  socketIoToShoppingList,
  socketIoToProductLog
};