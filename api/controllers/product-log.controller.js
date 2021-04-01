const ProductLog = require('./../models/product-log.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      Boom = require('@hapi/boom');

/**
* GET productLogs with pagination
*/

exports.findPaginate = async (req, res, next) => {
  try {
    const finalObject = await FindByQueryHelper.finalObjectProductLog(req, req.params.householdId, ProductLog);
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
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE All productLogs
*/
exports.removeAll = async (req, res, next) => {
  try {
    await ProductLog.deleteMany({householdId : req.params.householdId});
    return res.status(200).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};