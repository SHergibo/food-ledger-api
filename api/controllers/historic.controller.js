const Historic = require('./../models/historic.model'),
      Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      Helpers = require('./helpers/findByQueryParams.helpler');
      Boom = require('@hapi/boom');

/**
* Post one historic product
*/
exports.add = async (req, res, next) => {
  try {
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
    const household = await Household.findOne({ householdcode: req.params.householdCode });
    const finalObject = await Helpers.finalObject(req, household._id, Historic);

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
    const historic = await Historic.findById(req.params.historicId);
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
    if (req.body.number >= 1) {
      let historicToSwitch = await Historic.findById(req.params.historicId);
      
      let body = {
        name : historicToSwitch.name,
        brand : historicToSwitch.brand,
        type : historicToSwitch.type,
        weight : historicToSwitch.weight,
        kcal : historicToSwitch.kcal,
        location : historicToSwitch.location,
        expirationDate : historicToSwitch.expirationDate,
        number : req.body.number,
        householdId : historicToSwitch.householdId,
      }

      //TODO obligé de mettre une date dans le front pour la création du produit
      
      const product = new Product(body);
      await product.save();

      await Historic.findByIdAndDelete(historicToSwitch._id);
      
      const finalObject = await Helpers.finalObject(req, historicToSwitch.householdId, Historic);
      response = res.json(finalObject);
    }else{
      const historic = await Historic.findByIdAndUpdate(req.params.historicId, req.body, { override: true, upsert: true, new: true });
      response = res.json(historic.transform());
    }
    
    return response;
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one historic product
*/
exports.remove = async (req, res, next) => {
  try {
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
    const historic = await Historic.findByIdAndRemove(req.params.historicId);
    const finalObject = await Helpers.finalObject(req, historic.householdId, Historic);

    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};