const Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model'),
      Brand = require('./../models/brand.model'),
      Boom = require('@hapi/boom');

/**
* Trigger launch script
*/
exports.launch = async (req, res, next) => {
  try {
    const products = await Product.find({});
    const historics = await Historic.find({});
    const brands = await Brand.find({});

    products.forEach(async (product) => {
      await Product.findByIdAndUpdate(product._id, { isBeingEdited: false });
    });

    historics.forEach(async (historic) => {
      await Historic.findByIdAndUpdate(historic._id, { isBeingEdited: false });
    });

    brands.forEach(async (brand) => {
      await Brand.findByIdAndUpdate(brand._id, { isBeingEdited: false });
    });

    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};