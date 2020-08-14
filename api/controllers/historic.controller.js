const Historic = require('./../models/historic.model'),
      Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      FindByIdHelper = require('./helpers/findByQueryParams.helper'),
      SortExpDateHelper = require('./helpers/sortExpDate.helper'),
      Boom = require('@hapi/boom');

/**
* Post one historic product
*/
exports.add = async (req, res, next) => {
  try {
    const historic = new Historic(req.body);
    await historic.save();
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET historic product with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const finalObject = await FindByIdHelper.finalObject(req, household._id, Historic);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET one historic product
*/
exports.findOne = async (req, res, next) => {
  try {
    const historic = await Historic.findById(req.params.historicId);
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH one historic product
*/
exports.update = async (req, res, next) => {
  try {
    let response;
    if (req.body.number >= 1) {
      let newBody = await SortExpDateHelper.sortExpDate(req.body);
      
      const product = new Product(newBody);
      await product.save();

      await Historic.findByIdAndDelete(req.params.historicId);
      
      response = res.status(204).send();
    }else{
      const historic = await Historic.findByIdAndUpdate(req.params.historicId, req.body, { override: true, upsert: true, new: true });
      response = res.json(historic.transform());
    }
    
    return response;
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one historic product
*/
exports.remove = async (req, res, next) => {
  try {
    const historic = await Historic.findByIdAndDelete(req.params.historicId);
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one historic product and send new historic product list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    const historic = await Historic.findByIdAndRemove(req.params.historicId);
    const finalObject = await FindByIdHelper.finalObject(req, historic.householdId, Historic);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};