const Brand = require('../../../api/models/brand.model');

module.exports.createBrands = async ({householdId}) => {
  let brandsArray = [];
  for (const data of ['1', '2']) {    
    let objectBrand = {
      brandName: {
        label: `brand-${data}`,
        value: `brand-${data}`
      },
      numberOfProduct: 1,
      numberOfHistoric: 0,
      householdId: householdId,
    }
    const brand = new Brand(objectBrand);
    await brand.save();
    brandsArray = [brand, ...brandsArray];
  }

  return brandsArray;
};