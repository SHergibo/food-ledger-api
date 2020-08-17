const Brand = require('./../models/brand.model'),
      Boom = require('@hapi/boom');





/**
* GET all brands
*/
exports.findAll = async (req, res, next) => {
  try {
    const brands = await Brand.find({householdId : req.params.householdId});
    const fields = ['_id', 'brandName', 'numberOfProduct'];
        let arrayBrandTransformed = [];
        brands.forEach((item)=>{
            const object = {};
            fields.forEach((field)=>{
                object[field] = item[field];
            });
            arrayBrandTransformed.push(object);
        });
    return res.json(arrayBrandTransformed);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH one brand
*/
exports.update = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.brandId, req.body, { override: true, upsert: true, new: true });
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