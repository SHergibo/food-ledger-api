const ProductLog = require('../models/product-log.model'),
      Brand = require('../models/brand.model');

exports.productLogAdd = async (product, user) => {
  let brand = await Brand.findById(product.brand);
  let objectProduct = {
    productName: product.name,
    productBrand: brand.brandName.label,
    productWeight: product.weight,
    infoProduct: "Ajout",
    numberProduct: product.number,
    householdId: product.householdId,
    user: user._id
  }
  const productLog = new ProductLog(objectProduct);
  await productLog.save();
  return;
};

exports.productLogUpdate = async (oldProductNumber, product, user) => {
  let updatedNumber;
  if(Math.sign(oldProductNumber - parseInt(product.number)) === 1){
    updatedNumber = -Math.abs(oldProductNumber - parseInt(product.number));
  }else{
    updatedNumber = Math.abs(oldProductNumber - parseInt(product.number));
  }
  let brand = await Brand.findById(product.brand);
  let objectProduct = {
    productName: product.name,
    productBrand: brand.brandName.label,
    productWeight: product.weight,
    infoProduct: "Mise à jour",
    numberProduct: updatedNumber,
    householdId: product.householdId,
    user: user._id
  }
  const productLog = new ProductLog(objectProduct);
  await productLog.save();
  return;
};

exports.productLogDelete = async (product, user) => {
  let brand = await Brand.findById(product.brand);
  let objectProduct = {
    productName: product.name,
    productBrand: brand.brandName.label,
    productWeight: product.weight,
    infoProduct: "Suppression",
    numberProduct: product.number,
    householdId: product.householdId,
    user: user._id
  }
  const productLog = new ProductLog(objectProduct);
  await productLog.save();
  return;
};