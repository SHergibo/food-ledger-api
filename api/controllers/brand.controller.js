const Brand = require('./../models/brand.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      { socketIoTo } = require('./../helpers/socketIo.helper'),
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
    const finalObject = await FindByQueryHelper.finalObjectBrandList(req, req.params.householdId, Brand);
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
    socketIoTo(`${brand.householdId}-brand`, "addedBrand", brand.transform());
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
    const brand = await Brand.findByIdAndDelete(req.params.brandId);
    socketIoTo(`${brand.householdId}-brand`, "deletedBrand", brand._id);
    return res.json(brand.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE one brand and send new brand list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndRemove(req.params.brandId);
    const finalObject = await FindByQueryHelper.finalObjectBrandList(req, brand.householdId, Brand);
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};