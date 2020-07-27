const Product = require('./../models/product.model'),
  Household = require('./../models/household.model'),
  Boom = require('@hapi/boom');

/**
* Post one product
*/
exports.add = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdcode: req.body.householdCode });
    req.body.householdId = household._id; //TODO faire ceci dans le middleware ??
    const product = new Product(req.body);
    await product.save();
    console.log(product.transform());
    return res.json(product.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET products with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    let page = req.query.page || 0;
    let limit = 10;
    const household = await Household.findOne({ householdcode: req.params.householdCode });
    const products = await Product.find({ householdId: household._id })
    .skip(page * limit)
    .limit(limit);


    const totalProduct = await Product.estimatedDocumentCount();
    const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number'];
    let arrayProductsTransformed = [];
    products.forEach((item) => {
      const object = {};
      fields.forEach((field) => {
        object[field] = item[field];
      });
      arrayProductsTransformed.push(object);
    });
    let finalObject = {arrayProduct : arrayProductsTransformed, totalProduct}
    return res.json(finalObject);
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET one product
*/
exports.findOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    return res.json(product.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH product
*/
exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.productId, req.body, { override: true, upsert: true, new: true });
    return res.json(product.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE product
*/
exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    return res.json(product.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};