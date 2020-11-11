const Product = require('./../models/product.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Household = require('./../models/household.model'),
      Historic = require('./../models/historic.model'),
      FindByQueryHelper = require('./helpers/findByQueryParams.helper'),
      SortExpDateHelper = require('./helpers/sortExpDate.helper'),
      ProductLogHelper = require('./helpers/product-log.helper'),
      Slugify = require('./../utils/slugify'),
      BrandLogic = require('./helpers/brandLogic.helper'),
      Boom = require('@hapi/boom');

/**
* Post one product
*/
exports.add = async (req, res, next) => {
  try {
    let brand = await BrandLogic.brandLogicWhenCreate(req, "product");
    let newBody = await SortExpDateHelper.sortExpDate(req.body);
    newBody.slugName = Slugify.slugUrl(newBody.name);
    newBody.slugLocation = Slugify.slugUrl(newBody.location);
    newBody.brand = brand._id;
    const product = new Product(newBody);
    await product.save();
    await ProductLogHelper.productLogAdd(product, req.user);
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
    let shopping = await ShoppingList.findOne({product : product._id});

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

      req.body.slugName = Slugify.slugUrl(req.body.name);
      req.body.slugLocation = Slugify.slugUrl(req.body.location);
      const historic = new Historic(req.body);
      await historic.save();

      if(!shopping){
        const shoppingList = new ShoppingList({
          numberProduct: product.number,
          historic: historic._id,
          householdId: historic.householdId
        });
        await shoppingList.save();
      }else{
        await ShoppingList.findByIdAndUpdate(shopping._id, {historic : historic._id, $unset: { product: 1 }, numberProduct : (shopping.numberProduct + product.number)}, { override: true, upsert: true, new: true });
      }


      await Product.findByIdAndDelete(req.params.productId);

      response = res.json(historic.transform());
    } else {
      if (req.body.brand.value !== product.brand.brandName.value) {
        brand = await BrandLogic.brandLogicWhenUpdate(req, "product", false);
        req.body.brand = brand._id;
      }else if(req.body.brand.value === product.brand.brandName.value){
        req.body.brand = product.brand._id;
      }

      req.body.slugName = Slugify.slugUrl(req.body.name);
      req.body.slugLocation = Slugify.slugUrl(req.body.location);

      let newBody = await SortExpDateHelper.sortExpDate(req.body);
      let updatedProduct = await Product.findByIdAndUpdate(req.params.productId, newBody, { override: true, upsert: true, new: true }).populate('brand', 'brandName');

      if(product.number > req.body.number){
        let numberShoppingList = product.number - req.body.number;
        if(!shopping){
          const shoppingList = new ShoppingList({
            numberProduct: numberShoppingList,
            product: product._id,
            householdId: product.householdId
          });
          await shoppingList.save();
        }else{
          await ShoppingList.findByIdAndUpdate(shopping._id, {numberProduct : (shopping.numberProduct + numberShoppingList)}, { override: true, upsert: true, new: true });
        }
      }else{
        if(shopping){
          let numberShoppingList = req.body.number - product.number;
          if(shopping.numberProduct > req.body.number){
            await ShoppingList.findByIdAndUpdate(shopping._id, {numberProduct : (shopping.numberProduct - numberShoppingList)}, { override: true, upsert: true, new: true });
          }else{
            await ShoppingList.findByIdAndDelete(shopping._id);
          }
        }
      }
      
      response = res.json(updatedProduct.transform());
    }

    if(req.body.number !== product.number){
      await ProductLogHelper.productLogUpdate(product.number, req.body, req.user);
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
    await ProductLogHelper.productLogDelete(product, req.user);
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
    await ProductLogHelper.productLogDelete(product, req.user);
    const finalObject = await FindByQueryHelper.finalObject(req, product.householdId, Product);
    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};