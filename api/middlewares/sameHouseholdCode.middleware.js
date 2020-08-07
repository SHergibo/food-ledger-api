const Product = require('./../models/product.model'),
  Historic = require('./../models/historic.model'),
  Household = require('./../models/household.model'),
  Boom = require('@hapi/boom');

exports.checkSameHousehold = async (req, res, next) => {
  try {
    let householdCode;
    let household;
    let product;

    if (req.params.productId) {
      product = await Product.findById(req.params.productId);
    } else if (req.params.historicId) {
      product = await Historic.findById(req.params.historicId);
    }

    if (req.params.productId || req.params.historicId) {
      if (product) {
        household = await Household.findById(product.householdId);
      } else {
        return res.status(404).send(Boom.notFound("Ce produit n'existe pas !"));
      }
    }

    if (household) {
      householdCode = household.householdcode;
    }

    if (req.params.householdCode) {
      householdCode = req.params.householdCode;
    }

    if (householdCode === req.user.householdcode) {
      return next();
    } else {
      return next(Boom.unauthorized("Ce produit n'appartient pas à votre famille !"));
    }
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }

};