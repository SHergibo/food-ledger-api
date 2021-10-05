const ProductLog = require('./../models/product-log.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      { socketIoToProductLog } = require('./../helpers/socketIo.helper'),
      Boom = require('@hapi/boom');

/**
* GET productLogs with pagination
*/

exports.findPaginate = async (req, res, next) => {
  try {
    const finalObject = await FindByQueryHelper.finalObjectProductLog({pageIndex : req.query.page, findByData : req.params.householdId, model : ProductLog});
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE one productLog
*/
exports.remove = async (req, res, next) => {
  try {
    const productLog = await ProductLog.findById(req.params.productLogId);

    await socketIoToProductLog({data : productLog, type : "deletedData", model: ProductLog});

    await ProductLog.findByIdAndRemove(productLog._id);

    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE All productLogs
*/
exports.removeAll = async (req, res, next) => {
  try {
    await socketIoToProductLog({data : {householdId: req.params.householdId}, type : "deleteAll", model: ProductLog});
    await ProductLog.deleteMany({householdId : req.params.householdId});
    return res.status(200).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};