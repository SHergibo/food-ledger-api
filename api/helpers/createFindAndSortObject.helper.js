const Brand = require('../models/brand.model');

exports.createFindAndSortObject = async ({findObject, sortObject, queryParams}) => {
  let queryWithSort = false;
  let querySortObject = {};

  for (const key in queryParams) {
    if (key.split('-')[1] === "sort") {
      queryWithSort = true;
      if(key === "expirationDate-sort"){
        querySortObject["expirationDate.0"] = queryParams[key];
      }else{
        querySortObject[key.split('-')[0]] = queryParams[key];
      }
    }
    if (key !== "page" && key.split('-')[1] !== "sort") {
      if (key === "name" || key === "brand" || key === "type" || key === "location") {
        if(key === "name"){
          findObject["slugName"] = { $regex: queryParams[key], $options: 'i' };
        }else if(key === "location"){
          findObject["slugLocation"] = { $regex: queryParams[key], $options: 'i' };
        }else if(key === "brand"){
          let brand = await Brand.findOne({"brandName.value": queryParams[key]}); 
          findObject[key] = brand._id;
        }else if(key === "type"){
          findObject["type.value"] = { $regex: queryParams[key], $options: 'i' };
        }else{
          findObject[key] = { $regex: queryParams[key], $options: 'i' };
        }
      } else if(key === "expirationDate"){
        let dateUpperCase = queryParams[key].toUpperCase()
        let unSlugExpDate = dateUpperCase.split('T')[1].replace(/-/g, ":").replace("_", ".");
        let expDate = `${dateUpperCase.split('T')[0]}T${unSlugExpDate}`;
        findObject["expirationDate.expDate"] = expDate;
      } else {
        findObject[key] = queryParams[key];
      }
    }
  }

  if(queryWithSort) sortObject = querySortObject;

  return { findObject, sortObject };
};