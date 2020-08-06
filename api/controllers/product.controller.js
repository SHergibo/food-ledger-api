const Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      Historic = require('./../models/historic.model'),
      Helpers = require('./helpers/findByQueryParams.helpler');
      Boom = require('@hapi/boom');

/**
* Post one product
*/
exports.add = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    return res.json(product.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET products with pagination
*/

exports.findPaginate = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdcode: req.params.householdCode });
    const finalObject = await Helpers.finalObject(req, household._id, Product);
    return res.json(finalObject);
  } catch (error) {
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
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH one product
*/
exports.update = async (req, res, next) => {
  try {
    let response;
    if (req.body.number == 0) {
      let productToSwitch = await Product.findById(req.params.productId);
      
      let body = {
        name : productToSwitch.name,
        brand : productToSwitch.brand,
        type : productToSwitch.type,
        weight : productToSwitch.weight,
        kcal : productToSwitch.kcal,
        location : productToSwitch.location,
        expirationDate : productToSwitch.expirationDate,
        number : req.body.number,
        householdId : productToSwitch.householdId,
      }
      //TODO mettre expiration vide
      
      const historic = new Historic(body);
      await historic.save();

      await Product.findByIdAndDelete(productToSwitch._id);
      
      const finalObject = await Helpers.finalObject(req, productToSwitch.householdId, Product);
      //TODO plus besoin d'un final object si l'édition ne se fait plus dans le tableau dans le front
      response = res.json(finalObject);
    }else{
      const product = await Product.findByIdAndUpdate(req.params.productId, req.body, { override: true, upsert: true, new: true });
      response = res.json(product.transform());
    }
    
    return response;
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one product
*/
exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    return res.json(product.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one product and send new product list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndRemove(req.params.productId);
    const finalObject = await Helpers.finalObject(req, product.householdId, Product);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};