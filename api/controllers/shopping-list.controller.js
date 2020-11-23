const ShoppingList = require('./../models/shopping-list.model'),
      Household = require('./../models/household.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      NodeMailer = require('./../helpers/nodemailer.helper'),
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

/**
* Send mail shopping list
*/
exports.sendMail = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    let shoppingList = await ShoppingList.find({householdId : household._id})
    .populate({
      path: 'product',
      populate : {
        path: 'brand',
        select: {brandName: 1}
      },
      select: {
        name: 1,
        weight: 1,
      }
    })
    .populate({
      path: 'historic',
      populate : {
        path: 'brand',
        select: {brandName: 1}
      },
      select: {
        name: 1,
        weight: 1,
      }
    });

    if(shoppingList.length >= 1){
  
      let list = shoppingList.map(shopping => {
        return `<li>${shopping.product.name} - ${shopping.product.brand.brandName.label} - ${shopping.product.weight}gr - ${shopping.numberProduct}</li>`;
      }).join('');
  
      let output = `<h2>Voici votre liste de course à faire pour votre stock</h2>
        <ul>
        ${list}
        </ul>
      `;
  
      NodeMailer.send(output, 'Votre liste de course pour votre stock !');
    }
    return res.status(200).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};