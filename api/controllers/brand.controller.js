const Brand = require('./../models/brand.model'),
      Household = require('./../models/household.model'),
      Boom = require('@hapi/boom');

/**
* GET all brands
*/
exports.findAll = async (req, res, next) => {
  try {
    const household = await Household.findOne({householdCode : req.params.householdCode})
    const brands = await Brand.find({householdId : household._id})
    .sort({brandName : 1});
    const fields = ['_id', 'brandName', 'numberOfProduct', "numberOfHistoric"];
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
    //TODO faire attention à l'objet brandName et label et value en slugify
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