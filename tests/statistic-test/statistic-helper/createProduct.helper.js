const Product = require('../../../api/models/product.model');

module.exports.createProduct = async ({householdId}) => {
  let objectProduct = {
    type: { value: 'legume', label: 'Légume' },
    name: 'betteraves rouge',
    weight: '335',
    kcal: '2000',
    location: 'vert',
    minimumInStock: { minInStock: 0, updatedBy: 'user' },
    brand: "61530fb3132e752235b4f4b0",
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

  return product;
};