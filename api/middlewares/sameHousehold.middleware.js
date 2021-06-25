const Product = require('../models/product.model'),
  Historic = require('../models/historic.model'),
  Household = require('../models/household.model'),
  Brand = require('../models/brand.model'),
  ProductLog = require('../models/product-log.model'),
  ShoppingList = require('../models/shopping-list.model'),
  Boom = require('@hapi/boom');

exports.checkSameHousehold = async (req, res, next) => {
  try {
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

    if(req.body.householdId){
      household = await Household.findById(req.body.householdId);
    }else if(!req.params.householdId && !req.body.householdId){
      if(data){
        household = await Household.findById(data.householdId);
      }else{
        return next(Boom.notFound("Cette donnée n'existe pas!"));
      }
    }

    if ((household && household._id.toString() === req.user.householdId.toString()) || (req.params.householdId.toString() === req.user.householdId.toString())) {
      res.locals.householdData = household;
      return next();
    } else {
      return next(Boom.unauthorized("Vous n'avez pas accès à cette donnée car elle n'appartient pas à votre famille!"));
    }
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }

};