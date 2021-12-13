const ProductLog = require('../../../api/models/product-log.model');

module.exports.createProductLog = async ({householdId, userId}) => {
  let productLogArray = [];
  for (const data of ['1', '2']) {    
    let objectProduct = {
      productName: `product-${data}`,
      productBrand: `brand-product-${data}`,
      productWeight: `product-${data}-weight`,
      infoProduct: "Ajout",
      numberProduct: 1,
      householdId: householdId,
      user: userId
    }
    const productLog = new ProductLog(objectProduct);
    await productLog.save();
    productLogArray = [productLog, ...productLogArray];
  }

  return productLogArray;
};