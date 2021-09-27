const Brand = require('./../models/brand.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      { socketIoTo, socketIoToBrand } = require('./../helpers/socketIo.helper'),
      Boom = require('@hapi/boom');

/**
* GET one brand
*/
exports.findOne = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId)
    .sort({brandName : 1});

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
    const finalObject = await FindByQueryHelper.finalObjectBrandList(req.query.page, req.params.householdId, Brand);
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
    socketIoToBrand({brandData : brand, type : "updatedBrand"});
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

    await socketIoToBrand({brandData : brand, type : "deletedBrand"});

    await Brand.findByIdAndDelete(brand._id);
    
    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};