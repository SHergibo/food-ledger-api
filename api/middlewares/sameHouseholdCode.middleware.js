const Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model'),
      Household = require('./../models/household.model'),
      Boom = require('@hapi/boom');

exports.checkSameHousehold = async (req, res, next) => {
  try {
    let householdCode;
    let household;

    if(req.params.productId){
      const product = await Product.findById(req.params.productId);
      household = await Household.findById(product.householdId);
    }else if (req.params.historicId){
      const historic = await Historic.findById(req.params.historicId);
      household = await Household.findById(historic.householdId);
    } 
    
    if(household){
      householdCode = household.householdcode;
    }

    if (req.params.householdCode){
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