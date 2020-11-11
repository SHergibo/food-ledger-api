const Historic = require('./../models/historic.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      FindByQueryHelper = require('./helpers/findByQueryParams.helper'),
      SortExpDateHelper = require('./helpers/sortExpDate.helper'),
      BrandLogic = require('./helpers/brandLogic.helper'),
      ProductLogHelper = require('./helpers/product-log.helper'),
      Slugify = require('./../utils/slugify'),
      Boom = require('@hapi/boom');

/**
* Post one historic product
*/
exports.add = async (req, res, next) => {
  try {
    let brand = await BrandLogic.brandLogicWhenCreate(req, "historic");
    req.body.slugName = Slugify.slugUrl(req.body.name);
    req.body.slugLocation = Slugify.slugUrl(req.body.location);
    req.body.brand = brand._id;
    const historic = new Historic(req.body);
    await historic.save();
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET historic product with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const finalObject = await FindByQueryHelper.finalObject(req, household._id, Historic);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET one historic product
*/
exports.findOne = async (req, res, next) => {
  try {
    const historic = await Historic.findById(req.params.historicId).populate('brand', "brandName");
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH one historic product
*/
exports.update = async (req, res, next) => {
  try {
    let response;
    let brand;

    let historic = await Historic.findById(req.params.historicId).populate('brand', 'brandName');

    if (req.body.number >= 1) {
      let oldHistoric;
      if(req.body.brand.value !== historic.brand.brandName.value){
        brand = await BrandLogic.brandLogicWhenUpdate(req, "product", true);
        req.body.brand = brand._id;
      }else if (req.body.brand.value === historic.brand.brandName.value){
        await BrandLogic.brandLogicWhenSwitching(req, "product");
        oldHistoric = await Historic.findById(req.params.historicId);
        req.body.brand = oldHistoric.brand;
      }

      let newBody = await SortExpDateHelper.sortExpDate(req.body);
      newBody.slugName = Slugify.slugUrl(newBody.name);
      newBody.slugLocation = Slugify.slugUrl(newBody.location);
      
      const product = new Product(newBody);
      await product.save();

      let shopping = await ShoppingList.findOne({historic : historic._id});
      if(shopping){
        if(req.body.number >= shopping.numberProduct){
          await ShoppingList.findByIdAndDelete(shopping._id);
        }else{
          await ShoppingList.findByIdAndUpdate(shopping._id, {$unset: { historic: 1 }, product: product._id, numberProduct : (shopping.numberProduct - req.body.number)}, { override: true, upsert: true, new: true });
        }
      }

      await Historic.findByIdAndDelete(req.params.historicId);
      
      response = res.json(product.transform());
    }else{

      if (req.body.brand.value !== historic.brand.brandName.value) {
        brand = await BrandLogic.brandLogicWhenUpdate(req, "historic", false);
        req.body.brand = brand._id;
      }else if(req.body.brand.value === historic.brand.brandName.value){
        req.body.brand = historic.brand._id;
      }

      req.body.slugName = Slugify.slugUrl(req.body.name);
      req.body.slugLocation = Slugify.slugUrl(req.body.location);

      let updatedHistoric = await Historic.findByIdAndUpdate(req.params.historicId, req.body, { override: true, upsert: true, new: true }).populate('brand', 'brandName');
      response = res.json(updatedHistoric.transform());
    }

    if(req.body.number !== historic.number){
      await ProductLogHelper.productLogUpdate(historic.number, req.body, req.user);
    }
    
    return response;
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one historic product
*/
exports.remove = async (req, res, next) => {
  try {
    await BrandLogic.brandLogicWhenDelete(req, "historic");
    const historic = await Historic.findByIdAndDelete(req.params.historicId);
    return res.json(historic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one historic product and send new historic product list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    await BrandLogic.brandLogicWhenDelete(req, "historic");
    const historic = await Historic.findByIdAndRemove(req.params.historicId);
    const finalObject = await FindByQueryHelper.finalObject(req, historic.householdId, Historic);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};