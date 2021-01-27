const Product = require('./../models/product.model'),
  Historic = require('./../models/historic.model'),
  Household = require('./../models/household.model'),
  Brand = require('./../models/brand.model'),
  ProductLog = require('./../models/product-log.model'),
  ShoppingList = require('./../models/shopping-list.model'),
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
    }else if (req.params.productLogId) {
      data = await ProductLog.findById(req.params.productLogId);
    }else if (req.params.shoppingId) {
      data = await ShoppingList.findById(req.params.shoppingId);
    }

    if(!req.params.householdCode && !req.params.householdId){
      if (data) {
        household = await Household.findById(data.householdId);
      } else {
        return next(Boom.notFound("Cette donnée n'existe pas !"));
      }
    }

    if (household) {
      householdCode = household.householdCode;
    }

    if (req.params.householdCode) {
      householdCode = req.params.householdCode;
    }

    if(req.params.householdId){
      household = await Household.findById(req.params.householdId);
      householdCode = household.householdCode;
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