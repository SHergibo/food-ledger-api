const Brand = require('./../models/brand.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      { socketIoToBrand } = require('./../helpers/socketIo.helper'),
      Boom = require('@hapi/boom');

/**
* GET one brand
*/
exports.findOne = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId);

    return res.json(brand.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET all brands
*/
exports.findAll = async (req, res, next) => {
  try {
    const brands = await Brand.find({householdId : req.params.householdId})
    .sort({brandName : 1});

    return res.json(transformArray(brands, 'brand'));
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET brand List with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const finalObject = await FindByQueryHelper.finalObjectBrandList({pageIndex : req.query.page, findByData : req.params.householdId, model : Brand});
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH one brand
*/
exports.update = async (req, res, next) => {
  try {
    //TODO faire attention à l'objet brandName et label et value en slugify
    const brand = await Brand.findByIdAndUpdate(req.params.brandId, req.body);
    await socketIoToBrand({data : brand, type : "updatedData", model: Brand});
    return res.json(brand.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE one brand
*/
exports.remove = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId);

    await socketIoToBrand({data : brand, type : "deletedData", model: Brand});

    await Brand.findByIdAndDelete(brand._id);
    
    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};