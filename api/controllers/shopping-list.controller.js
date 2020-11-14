const ShoppingList = require('./../models/shopping-list.model'),
      Household = require('./../models/household.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      Boom = require('@hapi/boom');

/**
* GET shopping List with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const finalObject = await FindByQueryHelper.finalObjectShoppingList(req, household._id, ShoppingList);
    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE one shopping and send new shopping list using front-end pagination data
*/
exports.removePagination = async (req, res, next) => {
  try {
    const shopping = await ShoppingList.findByIdAndRemove(req.params.shoppingId);
    const finalObject = await FindByQueryHelper.finalObjectShoppingList(req, shopping.householdId, ShoppingList);
    return res.json(finalObject);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* DELETE shopping list
*/
exports.removeAll = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    await ShoppingList.deleteMany({householdId : household._id});
    return res.status(200).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};