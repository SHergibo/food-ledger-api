const Product = require('./../models/product.model'),
  Historic = require('./../models/historic.model'),
  Household = require('./../models/household.model'),
  Brand = require('./../models/brand.model'),
  Boom = require('@hapi/boom');

exports.checkSameHousehold = async (req, res, next) => {
  try {
    let householdCode;
    let household;
    let data;

    if (req.params.productId) {
      data = await Product.findById(req.params.productId);
    } else if (req.params.historicId) {
      data = await Historic.findById(req.params.historicId);
    }else if (req.params.brandId) {
      data = await Brand.findById(req.params.brandId);
    }

    if(!req.params.householdCode){
      if (data) {
        household = await Household.findById(data.householdId);
      } else {
        return res.status(404).send(Boom.notFound("Cette donnée n'existe pas !"));
      }
    }

    if (household) {
      householdCode = household.householdCode;
    }

    if (req.params.householdCode) {
      householdCode = req.params.householdCode;
    }

    if (householdCode === req.user.householdCode) {
      return next();
    } else {
      return next(Boom.unauthorized("Vous n'avez pas accès à cette donnée car elle n'appartient pas à votre famille !"));
    }
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }

};