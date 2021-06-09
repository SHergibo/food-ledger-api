const Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model'),
      Boom = require('@hapi/boom');

/**
* Trigger launch script
*/
exports.launch = async (req, res, next) => {
  try {
    const products = await Product.find({});
    const historics = await Historic.find({});

    products.forEach(async (product) => {
      await Product.findByIdAndUpdate(product._id, { isBeingEdited: false });
    });

    historics.forEach(async (historic) => {
      await Historic.findByIdAndUpdate(historic._id, { isBeingEdited: false });
    });

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};