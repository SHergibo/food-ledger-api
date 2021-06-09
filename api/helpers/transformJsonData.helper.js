exports.transformArray = (dataArray, fieldName) => {

  let objectFields = {
    notification: ['_id', 'message', 'type', 'urlRequest', 'expirationDate'],
    notificationUserId: ['_id', 'message', 'type', 'urlRequest', 'expirationDate', 'userId'],
    notificationHouseholdId: ['_id', 'message', 'type', 'urlRequest', 'expirationDate', 'householdId'],
    product: ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number', 'minimumInStock', 'isBeingEdited'],
    brand: ['_id', 'brandName', 'numberOfProduct', "numberOfHistoric"],
    productLog: ['_id', 'productName', 'productBrand', 'productWeight', 'infoProduct', 'numberProduct', 'householdId', 'user', 'createdAt'],
    shoppingList: ['_id', 'product', 'historic', 'numberProduct', 'createdAt']
  }
  
  let arrayTransformed = [];
  dataArray.forEach((item) => {
    const object = {};
    objectFields[fieldName].forEach((field) => {
      object[field] = item[field];
    });
    arrayTransformed.push(object);
  });
  return arrayTransformed;
};

exports.transformObject = (objectData, fieldName) => {

  let objectFields = {
    notification : ['_id', 'message', 'type', 'urlRequest', 'userId']
  }
  const object = {};
  objectFields[fieldName].forEach((field)=>{
    object[field] = objectData[field];
  });
  return object;
}