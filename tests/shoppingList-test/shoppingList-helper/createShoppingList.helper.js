const ShoppingList = require('../../../api/models/shopping-list.model'),
      Product = require('../../../api/models/product.model'),
      Brand = require('../../../api/models/brand.model');

module.exports.createShoppingList = async ({householdId}) => {

  let objectBrand = {
    brandName: {
      label: `brand-1`,
      value: `brand-1`
    },
    numberOfProduct: 1,
    numberOfHistoric: 0,
    householdId: householdId,
  }
  const brand = new Brand(objectBrand);
  await brand.save();

  let objectProduct = {
    type: { value: 'legume', label: 'Légume' },
    name: 'betteraves rouge',
    weight: '335',
    kcal: '2000',
    location: 'vert',
    minimumInStock: { minInStock: 0, updatedBy: 'user' },
    brand: brand._id,
    expirationDate: [
      { expDate: '2021-12-15T23:00:00.000Z', productLinkedToExpDate: 1 }
    ],
    number: 1,
    householdId: householdId,
    slugName: 'betteraves-rouge',
    slugLocation: 'vert'
  }
  
  const product = new Product(objectProduct);
  await product.save();

  let shoppinListArray = [];
  for (let index = 0; index < 15; index++) {
    let objectShoppingList = {
      numberProduct: index,
      product: product._id,
      householdId: householdId
    }
    const shoppingList = new ShoppingList(objectShoppingList);
    await shoppingList.save();
    shoppinListArray = [shoppingList, ...shoppinListArray];
  }

  return shoppinListArray;
};