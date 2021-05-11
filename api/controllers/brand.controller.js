const Brand = require('./../models/brand.model'),
      { transformArray } = require('./../helpers/transformJsonData.helper'),
      Boom = require('@hapi/boom');

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
    return res.json(brand.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};