const Brand = require('./../models/brand.model'),
      Household = require('./../models/household.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      { injectHouseholdNameInNotifArray } = require('./../helpers/transformNotification.helper');

const LIMIT = 12;

exports.finalObject = async (req, householdId, model, productId) => {
  let queryObject = req.query;
  let queryWithSort = false;
  let querySortObject = {};
  let page = req.query.page || 0;

  let findObject = { householdId: householdId };

  if(productId){
    findObject = {_id: {$ne: productId},  householdId: householdId };
  }

  let totalProduct = await model.countDocuments(findObject);

  for (const key in queryObject) {
    if (key.split('-')[1] === "sort") {
      queryWithSort = true;
      if(key === "expirationDate-sort"){
        querySortObject["expirationDate.0"] = queryObject[key];
      }else{
        querySortObject[key.split('-')[0]] = queryObject[key];
      }
    }
    if (key !== "page" && key.split('-')[1] !== "sort") {
      if (key === "name" || key === "brand" || key === "type" || key === "location") {
        if(key === "name"){
          findObject["slugName"] = { $regex: queryObject[key], $options: 'i' };
        }else if(key === "location"){
          findObject["slugLocation"] = { $regex: queryObject[key], $options: 'i' };
        }else if(key === "brand"){
          let brand = await Brand.findOne({"brandName.value": queryObject[key]}); 
          findObject[key] = brand._id;
        }else if(key === "type"){
          findObject["type.value"] = { $regex: queryObject[key], $options: 'i' };
        }else{
          findObject[key] = { $regex: queryObject[key], $options: 'i' };
        }
      } else if(key === "expirationDate"){
        let dateUpperCase = queryObject[key].toUpperCase()
        let unSlugExpDate = dateUpperCase.split('T')[1].replace(/-/g, ":").replace("_", ".");
        let expDate = `${dateUpperCase.split('T')[0]}T${unSlugExpDate}`;
        findObject["expirationDate.expDate"] = expDate;
      } else {
        findObject[key] = queryObject[key];
      }
      //TODO faire une regex?? pour rechercher par année ou mois/année ou jour/mois/année
    }
  }

  let products;
  if (queryWithSort) {
    products = await model.find(findObject)
      .populate('brand', 'brandName')
      .skip(page * LIMIT)
      .limit(LIMIT)
      .sort(querySortObject);
  } else {
    products = await model.find(findObject)
      .populate('brand', 'brandName')
      .skip(page * LIMIT)
      .limit(LIMIT)
      .sort({createdAt : -1});
  }

  if (Object.keys(findObject).length >= 2) {
    const countProductSearch = await model.find(findObject);
    totalProduct = countProductSearch.length;
  }

  return {arrayData : transformArray(products, 'product'), totalProduct};
};

exports.finalObjectProductLog = async (pageIndex, householdId, model, productLogId) => {
  let page = pageIndex || 0;

  let findObject = { householdId: householdId };

  if(productLogId){
    findObject = {_id: {$ne: productLogId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let productLog = await model.find(findObject)
      .populate('user', "firstname")
      .skip(page * LIMIT)
      .limit(LIMIT)
      .sort({createdAt : -1});
  
  return {arrayData : transformArray(productLog, 'productLog'), totalData};
};

exports.finalObjectShoppingList = async (pageIndex, householdId, model, shoppingId) => {
  let page = pageIndex || 0;

  let findObject = { householdId: householdId };

  if(shoppingId){
    findObject = {_id: {$ne: shoppingId},  householdId: householdId };
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
      .skip(page * LIMIT)
      .limit(LIMIT)
      .sort({createdAt : -1});

  return {arrayData : transformArray(shoppingList, 'shoppingList'), totalData}
};

exports.finalObjectBrandList = async (pageIndex, householdId, model, brandId) => {
  let page = pageIndex || 0;

  let findObject = { householdId: householdId };

  if(brandId){
    findObject = {_id: {$ne: brandId},  householdId: householdId };
  }

  let totalData = await model.countDocuments(findObject);

  let brand = await model.find(findObject)
      .skip(page * LIMIT)
      .limit(LIMIT)
      .sort({createdAt : -1});
  
  return {arrayData : transformArray(brand, 'brand'), totalData};
};

exports.finalObjectNotifReceivedList = async (pageIndex, user, model, notificationId) => {
  let page = pageIndex || 0;

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

  if(notificationId){
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

  let totalNotifReceived = await model.countDocuments(findObject);

  let notificationsReceived = await model.find(findObject)
    .populate({
      path: 'householdId',
      select: 'householdName -_id'
    })
    .skip(page * LIMIT)
    .limit(LIMIT);

  if(user.role === "admin"){
    notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
  }

  if(user.role === "user"){
    notificationsReceived = injectHouseholdNameInNotifArray(notificationsReceived);
  }
  
  return {arrayData : transformArray(notificationsReceived, 'notificationHouseholdId'), totalNotifReceived};
};

exports.finalObjectNotifSendedList = async (pageIndex, user, model, notificationId) => {
  let page = pageIndex || 0;

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

  if(notificationId){
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

  
  let totalNotifSended = await model.countDocuments(findObject);

  let notificationsSended = [];
  
  if(user.role === "admin"){
    notificationsSended = await model.find(findObject)
      .populate({
        path: 'userId',
        select: 'firstname lastname -_id'
      })
      .skip(page * LIMIT)
      .limit(LIMIT)
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
    notificationsSended = await model.find({senderUserId: user._id})    
      .skip(page * LIMIT)
      .limit(LIMIT)
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

