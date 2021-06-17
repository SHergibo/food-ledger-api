const Brand = require('./../models/brand.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
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
    next(Boom.badImplementation(error.message));
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
    next(Boom.badImplementation(error.message));
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
    next(Boom.badImplementation(error.message));
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
    next(Boom.badImplementation(error.message));
  }
};