const Historic = require('./../models/historic.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Product = require('./../models/product.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      SortExpDateHelper = require('./../helpers/sortExpDate.helper'),
      BrandLogic = require('./../helpers/brandLogic.helper'),
      ProductLogHelper = require('./../helpers/product-log.helper'),
      Slugify = require('./../utils/slugify'),
      { socketIoTo } = require('./../helpers/socketIo.helper'),
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

    let historicWithBrand = await Historic.findById(historic._id)
    .populate('brand', 'brandName');
    socketIoTo(`${historic.householdId}-historique`, "addedProduct", historicWithBrand.transform());

    return res.json(historic.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET historic product with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const finalObject = await FindByQueryHelper.finalObject(req, req.params.householdId, Historic);

    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
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
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH one historic product
*/
exports.update = async (req, res, next) => {
  try {
    let response;
    let brand;

    const historic = await Historic.findById(req.params.historicId).populate('brand', 'brandName');

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
          await ShoppingList.findByIdAndUpdate(shopping._id, {$unset: { historic: 1 }, product: product._id, numberProduct : (shopping.numberProduct - req.body.number)});
        }
      }

      await Historic.findByIdAndDelete(req.params.historicId);
      
      response = res.json(product.transform());
      socketIoTo(`${product.householdId}-historique`, "deletedProduct", historic._id);

      let productWithBrand = await Product.findById(product._id)
      .populate('brand', 'brandName');
      socketIoTo(`${product.householdId}-produit`, "addedProduct", productWithBrand.transform());
    }else{

      if (req.body.brand.value !== historic.brand.brandName.value) {
        brand = await BrandLogic.brandLogicWhenUpdate(req, "historic", false);
        req.body.brand = brand._id;
      }else if(req.body.brand.value === historic.brand.brandName.value){
        req.body.brand = historic.brand._id;
      }

      req.body.slugName = Slugify.slugUrl(req.body.name);
      req.body.slugLocation = Slugify.slugUrl(req.body.location);

      let updatedHistoric = await Historic.findByIdAndUpdate(req.params.historicId, req.body).populate('brand', 'brandName');
      
      response = res.json(updatedHistoric.transform());
      socketIoTo(`${updatedHistoric.householdId}-historique`, "updatedProduct", updatedHistoric.transform());
    }

    if(req.body.number !== historic.number){
      await ProductLogHelper.productLogUpdate(historic.number, req.body, req.user);
    }
    
    return response;
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE one historic product
*/
exports.remove = async (req, res, next) => {
  try {
    await BrandLogic.brandLogicWhenDelete(req, "historic");
    const historic = await Historic.findByIdAndDelete(req.params.historicId);
    const shopping = await ShoppingList.findOne({historic : historic._id});
    if(shopping){
      await ShoppingList.findByIdAndDelete(shopping._id);
    }
    socketIoTo(`${historic.householdId}-historique`, "deletedProduct", historic._id);
    return res.json(historic.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* DELETE one historic product and send new historic product list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    await BrandLogic.brandLogicWhenDelete(req, "historic");
    const historic = await Historic.findByIdAndRemove(req.params.historicId);

    const shopping = await ShoppingList.findOne({historic : historic._id});
    if(shopping){
      await ShoppingList.findByIdAndDelete(shopping._id);
    }

    const finalObject = await FindByQueryHelper.finalObject(req, historic.householdId, Historic);

    socketIoTo(`${historic.householdId}-historique`, "deletedProduct", historic._id);
    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* Download Historic list
*/
exports.download = async (req, res, next) => {
  try {
    const historicList = await Historic.find({householdId : req.params.householdId}).populate('brand', 'brandName');
    let finaleHistoricList = [];
    historicList.forEach(histList => {
      let historicObject = {
          "Nom" : histList.name,
          "Marque" : histList.brand.brandName.value,
          "Type" : histList.type.label,
          "Poids" : histList.weight,
          "Kcal" : histList.kcal,
          "Emplacement" : histList.location
        }

      finaleHistoricList.push(historicObject)
    });

    return res.json(finaleHistoricList);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};