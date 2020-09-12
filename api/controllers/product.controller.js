const Product = require('./../models/product.model'),
  Household = require('./../models/household.model'),
  Historic = require('./../models/historic.model'),
  FindByQueryHelper = require('./helpers/findByQueryParams.helper'),
  SortExpDateHelper = require('./helpers/sortExpDate.helper'),
  BrandLogic = require('./helpers/brandLogic.helper'),
  Boom = require('@hapi/boom');

/**
* Post one product
*/
exports.add = async (req, res, next) => {
  try {
    await BrandLogic.brandLogicWhenCreate(req, "product");
    let newBody = await SortExpDateHelper.sortExpDate(req.body);
    const product = new Product(newBody);
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
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const finalObject = await FindByQueryHelper.finalObject(req, household._id, Product);
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
      let oldProduct;
      if(req.body.brand){
        await BrandLogic.brandLogicWhenUpdate(req, "historic", true);
      }else if (!req.body.brand){
        await BrandLogic.brandLogicWhenSwitching(req, "historic");
        oldProduct = await Product.findById(req.params.productId);
        req.body.brand = oldProduct.brand;
      }

      const historic = new Historic(req.body);
      await historic.save();

      await Product.findByIdAndDelete(req.params.productId);

      response = res.json(historic.transform());
    } else {

      if (req.body.brand) {
        await BrandLogic.brandLogicWhenUpdate(req, "product", false);
      }

      let newBody = await SortExpDateHelper.sortExpDate(req.body);
      const product = await Product.findByIdAndUpdate(req.params.productId, newBody, { override: true, upsert: true, new: true });
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
    await BrandLogic.brandLogicWhenDelete(req, "product");
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
    await BrandLogic.brandLogicWhenDelete(req, "product");
    const product = await Product.findByIdAndRemove(req.params.productId);
    const finalObject = await FindByQueryHelper.finalObject(req, product.householdId, Product);
    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};