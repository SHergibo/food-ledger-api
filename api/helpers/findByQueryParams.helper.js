const Household = require('./../models/household.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      { injectHouseholdNameInNotifArray } = require('./../helpers/transformNotification.helper'),
      { createFindAndSortObject }  = require('./createFindAndSortObject.helper'),
      { pageSize } = require('./../utils/globalVariable');

exports.finalObject = async ({pageIndex, req, findByData, model, dataId}) => {
  let queryObject = req.query;
  let page = req.query.page || pageIndex;
  let householdId = findByData;

  let findObject = { householdId: householdId };
  let sortObject = { createdAt : -1 };

  if(dataId){
    findObject = {_id: {$ne: dataId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  ({findObject, sortObject} = await createFindAndSortObject({findObject, sortObject, queryParams : queryObject, householdId}));

  let products = await model.find(findObject)
    .populate('brand', 'brandName')
    .skip(page * pageSize)
    .limit(pageSize)
    .sort(sortObject);

  if (Object.keys(findObject).length >= 2) {
    const countProductSearch = await model.find(findObject);
    totalData = countProductSearch.length;
  }

  return {arrayData : transformArray(products, 'product'), totalData};
};

exports.finalObjectProductLog = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let householdId = findByData;

  let findObject = { householdId: householdId };

  if(dataId){
    findObject = {_id: {$ne: dataId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let productLog = await model.find(findObject)
      .populate('user', "firstname")
      .skip(page * pageSize)
      .limit(pageSize)
      .sort({createdAt : -1});
  
  return {arrayData : transformArray(productLog, 'productLog'), totalData};
};

exports.finalObjectShoppingList = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let householdId = findByData;

  let findObject = { householdId: householdId };

  if(dataId){
    findObject = {_id: {$ne: dataId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let shoppingList = await model.find(findObject)
      .populate({
        path: 'product',
        populate : {
          path: 'brand',
          select: {brandName: 1}
        },
        select: {
          name: 1,
          weight: 1,
        }
      })
      .populate({
        path: 'historic',
        populate : {
          path: 'brand',
          select: {brandName: 1}
        },
        select: {
          name: 1,
          weight: 1,
        }
      })
      .skip(page * pageSize)
      .limit(pageSize)
      .sort({createdAt : -1});

  return {arrayData : transformArray(shoppingList, 'shoppingList'), totalData}
};

exports.finalObjectBrandList = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let householdId = findByData;

  let findObject = { householdId: householdId };

  if(dataId){
    findObject = {_id: {$ne: dataId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let brand = await model.find(findObject)
      .skip(page * pageSize)
      .limit(pageSize)
      .sort({createdAt : -1});
  
  return {arrayData : transformArray(brand, 'brand'), totalData};
};

exports.finalObjectUserList = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let householdId = findByData;

  let findObject = { householdId: householdId };

  if(dataId){
    findObject = {_id: {$ne: dataId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let user = await model.find(findObject)
      .skip(page * 5)
      .limit(5)
      .sort({createdAt : -1});
  
  return {arrayData : transformArray(user, 'user'), totalData};
};

exports.finalObjectNotifReceivedList = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let user = findByData;

  let findObject = { userId: user._id };

  if(user.role === "admin"){
    findObject = {$or : 
      [
        { userId: user._id },
        { householdId : user.householdId, type: "invitation-user-to-household" },
        { householdId : user.householdId, type: "information", userId: { $exists: false } },
      ]
    };
  }

  if(dataId){
    findObject = {_id: {$ne: dataId},  userId: user._id };

    if(user.role === "admin"){
      findObject = {$and : [
        { _id: {$ne: dataId} },
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

  let totalNotifReceived = await model.countDocuments(findObject);

  let notificationsReceived = await model.find(findObject)
    .populate({
      path: 'householdId',
      select: 'householdName -_id'
    })
    .skip(page * pageSize)
    .limit(pageSize);

  if(user.role === "admin"){
    notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
  }

  if(user.role === "user"){
    notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
  }
  
  return {arrayData : transformArray(notificationsReceived, 'notificationHouseholdId'), totalNotifReceived};
};

exports.finalObjectNotifSendedList = async ({pageIndex, findByData, model, dataId}) => {
  let page = pageIndex || 0;
  let user = findByData;

  let findObject = { senderUserId: user._id };

  if(user.role === "admin"){
    findObject = {$or : 
      [
        { senderUserId: user._id },
        { householdId : user.householdId, type: "invitation-household-to-user" },
        { householdId : user.householdId, type: "need-switch-admin" }
      ]
    };
  }

  if(dataId){
    findObject = {_id: {$ne: dataId},  senderUserId: user._id };

    if(user.role === "admin"){
      findObject = {$and : [
        { _id: {$ne: dataId} },
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

  
  let totalNotifSended = await model.countDocuments(findObject);

  let notificationsSended = [];
  
  if(user.role === "admin"){
    notificationsSended = await model.find(findObject)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      })
      .skip(page * pageSize)
      .limit(pageSize)
      .lean();

    for(let notif of notificationsSended){
      if(notif.senderUserId){
        let otherHousehold = await Household.findById(notif.householdId)
        .populate({
          path: 'userId',
          select: 'firstname lastname -_id'
        });
        notif.userId = { firstname: otherHousehold.userId.firstname, lastname: otherHousehold.userId.lastname };
      }
    }
  }

  if(user.role === "user"){
    notificationsSended = await model.find(findObject)    
      .skip(page * pageSize)
      .limit(pageSize)
      .lean();
    
    for(let notif of notificationsSended){
      let otherHousehold = await Household.findById(notif.householdId)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      });
      notif.userId = { firstname: otherHousehold.userId.firstname, lastname: otherHousehold.userId.lastname };
    }
  }
  
  return {arrayData : transformArray(notificationsSended, 'notificationUserId'), totalNotifSended};
};

