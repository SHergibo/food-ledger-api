const Product = require('./../models/product.model'),
  Household = require('./../models/household.model'),
  Boom = require('@hapi/boom');

exports.checkSameHousehold = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    const household = await Household.findById(product.householdId);
    if (household.householdcode === req.user.householdcode) {
      return next();
    } else {
      return next(Boom.unauthorized("Ce produit n'appartient pas à votre famille !"));
    }
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }

};