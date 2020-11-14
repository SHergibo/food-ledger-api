const Brand = require('./../models/brand.model');

const transformedFinalObject = (arrayFields, data, totalProduct) => {
  const fields = arrayFields;
  let arrayTransformed = [];
  data.forEach((item) => {
    const object = {};
    fields.forEach((field) => {
      object[field] = item[field];
    });
    arrayTransformed.push(object);
  });
  return finalObject = { arrayData: arrayTransformed, totalProduct };
}

exports.finalObject = async (req, householdId, model) => {
  let queryObject = req.query;
  let queryWithSort = false;
  let querySortObject = {};
  let page = req.query.page || 0;
  let limit = 14;


  let findObject = { householdId: householdId };
  let totalProduct = await model.estimatedDocumentCount();

  for (const key in queryObject) {
    if (key.split('-')[1] === "sort") {
      queryWithSort = true;
      querySortObject[key.split('-')[0]] = queryObject[key];
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
      .skip(page * limit)
      .limit(limit)
      .sort(querySortObject);
  } else {
    products = await model.find(findObject)
      .populate('brand', 'brandName')
      .skip(page * limit)
      .limit(limit);
  }

  if (Object.keys(findObject).length >= 2) {
    const countProductSearch = await model.find(findObject);
    totalProduct = countProductSearch.length;
  }

  const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number', 'minimumInStock'];
  return transformedFinalObject(fields, products, totalProduct);
};

exports.finalObjectProductLog = async (req, householdId, model) => {
  let page = req.query.page || 0;
  let limit = 14;

  let findObject = { householdId: householdId };
  let totalProductLog = await model.estimatedDocumentCount();

  let productLog = await model.find(findObject)
      .populate('user', "firstname")
      .skip(page * limit)
      .limit(limit)
      .sort({createdAt : -1});

  const fields = ['_id', 'productName', 'productBrand', 'productWeight', 'infoProduct', 'numberProduct', 'householdId', 'user', 'createdAt'];
  return transformedFinalObject(fields, productLog, totalProductLog);
};

exports.finalObjectShoppingList = async (req, householdId, model) => {
  let page = req.query.page || 0;
  let limit = 14;

  let findObject = { householdId: householdId };
  let totalShoppingList = await model.estimatedDocumentCount();

  //TODO ajouter si c'est lié à un historic
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
      .skip(page * limit)
      .limit(limit);

  const fields = ['_id', 'product', 'historic', 'numberProduct', 'createdAt'];
  return transformedFinalObject(fields, shoppingList, totalShoppingList);
};

