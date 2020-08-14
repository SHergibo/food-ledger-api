exports.finalObject = async (req, householdId, model) => {
  let queryObject = req.query;
  let queryWithSort = false;
  let querySortObject = {};
  let page = req.query.page || 0;
  let limit = 10;


  let findObject = { householdId: householdId };
  let totalProduct = await model.estimatedDocumentCount();

  for (const key in queryObject) {
    if (key.split('-')[1] === "sort") {
      queryWithSort = true;
      querySortObject[key.split('-')[0]] = queryObject[key];
    }
    if (key !== "page" && key.split('-')[1] !== "sort") {
      if (key === "name" || key === "brand" || key === "type" || key === "location") {
        findObject[key] = { $regex: queryObject[key], $options: 'i' };
      } else {
        findObject[key] = queryObject[key];
      }
      //TODO faire une regex?? pour rechercher par année ou mois/année ou jour/mois/année
    }
  }

  let products;
  if (queryWithSort) {
    products = await model.find(findObject)
      .skip(page * limit)
      .limit(limit)
      .sort(querySortObject);
  } else {
    products = await model.find(findObject)
      .skip(page * limit)
      .limit(limit);
  }



  if (Object.keys(findObject).length >= 2) {
    const countProductSearch = await model.find(findObject);
    totalProduct = countProductSearch.length;
  }


  const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number'];
  let arrayProductsTransformed = [];
  products.forEach((item) => {
    const object = {};
    fields.forEach((field) => {
      object[field] = item[field];
    });
    arrayProductsTransformed.push(object);
  });
  let finalObject = { arrayProduct: arrayProductsTransformed, totalProduct };
  return finalObject;
};
