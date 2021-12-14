const Brand = require('../../../api/models/brand.model');

module.exports.createBrands = async ({householdId}) => {
  let brandsArray = [];
  for (let index = 0; index < 15; index++) {
    let objectBrand = {
      brandName: {
        label: `brand-${index}`,
        value: `brand-${index}`
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