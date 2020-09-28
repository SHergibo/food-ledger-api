const Product = require('./../models/product.model'),
  Household = require('./../models/household.model'),
  Historic = require('./../models/historic.model'),
  FindByQueryHelper = require('./helpers/findByQueryParams.helper'),
  SortExpDateHelper = require('./helpers/sortExpDate.helper'),
  slugify = require('slugify'),
  BrandLogic = require('./helpers/brandLogic.helper'),
  Boom = require('@hapi/boom');

/**
* Post one product
*/
exports.add = async (req, res, next) => {
  try {
    let brand = await BrandLogic.brandLogicWhenCreate(req, "product");
    let newBody = await SortExpDateHelper.sortExpDate(req.body);
    newBody.slugName = slugify(newBody.name, {lower: true});
    newBody.brand = brand._id;
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
    const product = await Product.findById(req.params.productId).populate('brand', "brandName");
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
    let brand;

    let product = await Product.findById(req.params.productId).populate('brand', 'brandName');

    if (req.body.number == 0) {
      let oldProduct;
      if(req.body.brand.value !== product.brand.brandName.value){
        brand = await BrandLogic.brandLogicWhenUpdate(req, "historic", true);
        req.body.brand = brand._id;
      }else if (req.body.brand.value === product.brand.brandName.value){
        await BrandLogic.brandLogicWhenSwitching(req, "historic");
        oldProduct = await Product.findById(req.params.productId);
        req.body.brand = oldProduct.brand;
      }

      req.body.slugName = slugify(req.body.name, {lower: true});
      const historic = new Historic(req.body);
      await historic.save();

      await Product.findByIdAndDelete(req.params.productId);

      response = res.json(historic.transform());
    } else {
      if (req.body.brand.value !== product.brand.brandName.value) {
        brand = await BrandLogic.brandLogicWhenUpdate(req, "product", false);
        req.body.brand = brand._id;
      }else if(req.body.brand.value === product.brand.brandName.value){
        req.body.brand = product.brand._id;
      }

      let newBody = await SortExpDateHelper.sortExpDate(req.body);
      product = await Product.findByIdAndUpdate(req.params.productId, newBody, { override: true, upsert: true, new: true }).populate('brand', 'brandName');
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