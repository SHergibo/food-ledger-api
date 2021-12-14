const ProductLog = require('../../../api/models/product-log.model');

module.exports.createProductLog = async ({householdId, userId}) => {
  let productLogArray = [];
  for (let index = 0; index < 15; index++) {
    let objectProduct = {
      productName: `product-${index}`,
      productBrand: `brand-product-${index}`,
      productWeight: `product-${index}-weight`,
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