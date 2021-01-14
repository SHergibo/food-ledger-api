const Statistic = require('../models/statistic.model'),
      Product = require('../models/product.model'),
      Historic = require('../models/historic.model'),
      Household = require('../models/household.model'),
      Boom = require('@hapi/boom');

exports.outdatedStatistics = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    let statistic;
    if(product){
      statistic = await Statistic.findOne({ householdId: product.householdId });
    }else{
      statistic = await Statistic.findOne({ householdId: req.body.householdId });
    }
    
    if(statistic && !statistic.isOutdated){
      if(req.baseUrl === "/api/v1/products"){
        if(req.method === "POST" || req.method === "DELETE"){
          statistic = await Statistic.findByIdAndUpdate(statistic._id, {isOutdated : true}, { override: true, upsert: true, new: true });
        }
        if(req.method === "PATCH"){
          if(product.number != req.body.number || product.kcal != req.body.kcal || product.type.value != req.body.type.value){
            statistic = await Statistic.findByIdAndUpdate(statistic._id, {isOutdated : true}, { override: true, upsert: true, new: true });
          }
        }
      }
      if(req.baseUrl === "/api/v1/historics"){
        if(req.method === "PATCH"){
          if(req.body.number >= 1){
            statistic = await Statistic.findByIdAndUpdate(statistic._id, {isOutdated : true}, { override: true, upsert: true, new: true });
          }
        }
      }
    }

    return next();

  } catch (error) {
    next(Boom.badImplementation(error.message));
  }

};