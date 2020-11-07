const ProductLog = require('./../models/product-log.model'),
      Household = require('./../models/household.model'),
      FindByQueryHelper = require('./helpers/findByQueryParams.helper'),
      Boom = require('@hapi/boom');

/**
* GET productLogs with pagination
*/

exports.findPaginate = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const finalObject = await FindByQueryHelper.finalObjectProductLog(req, household._id, ProductLog);
    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one productLog and send new productLog list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    const productLog = await ProductLog.findByIdAndRemove(req.params.productLogId);
    const finalObject = await FindByQueryHelper.finalObjectProductLog(req, productLog.householdId, ProductLog);
    return res.json(finalObject);
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE All productLogs
*/
exports.removeAll = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    await ProductLog.deleteMany({householdId : household._id});
    return res.status(200).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};