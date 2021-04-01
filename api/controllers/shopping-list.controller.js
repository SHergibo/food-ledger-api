const ShoppingList = require('./../models/shopping-list.model'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      NodeMailer = require('./../helpers/nodemailer.helper'),
      Boom = require('@hapi/boom');

/**
* GET shopping List with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    const finalObject = await FindByQueryHelper.finalObjectShoppingList(req, req.params.householdId, ShoppingList);
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
    await ShoppingList.deleteMany({householdId : req.params.householdId});
    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};


/**
* Download shopping list
*/
exports.download = async (req, res, next) => {
  try {
    const shoppingList = await ShoppingList.find({householdId : req.params.householdId})      
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

    const finalShoppingList = [];
    shoppingList.forEach(shopList => {
      let shoppingObject;
      if(shopList.product){
        shoppingObject = {
          "Nom" : shopList.product.name,
          "Marque" : shopList.product.brand.brandName.value,
          "Poids" : shopList.product.weight,
          "Nombre" : shopList.numberProduct
        }
      }else if (shopList.historic){
        shoppingObject = {
          "Nom" : shopList.historic.name,
          "Marque" : shopList.historic.brand.brandName.value,
          "Poids" : shopList.historic.weight,
          "Nombre" : shopList.numberProduct
        }
      }
      finalShoppingList.push(shoppingObject)
    });

    return res.json(finalShoppingList);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Send mail shopping list
*/
exports.sendMail = async (req, res, next) => {
  try {
    let shoppingList = await ShoppingList.find({householdId : req.params.householdId})
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
  
      let tr = shoppingList.map(shopping => {
        if(shopping.product){
          return `<tr>
                    <td>${shopping.product.name}</td>
                    <td>${shopping.product.brand.brandName.label}</td>
                    <td>${shopping.product.weight}gr</td>
                    <td>${shopping.numberProduct}</td>
                  </tr>`;
        }else if (shopping.historic){
          return `<tr>
                    <td>${shopping.historic.name}</td>
                    <td>${shopping.historic.brand.brandName.label}</td>
                    <td>${shopping.historic.weight}gr</td>
                    <td>${shopping.numberProduct}</td>
                  </tr>`;
        }
      }).join('');
  
      let output = `<h2>Voici votre liste de course à faire pour votre stock :</h2>
        <table>
          <thead>
              <tr>
                  <th>Nom du produit</th>
                  <th>Marque du produit</th>
                  <th>Poids du produit</th>
                  <th>Nombre de produit</th>
              </tr>
          </thead>
          <tbody>
              ${tr}
          </tbody>
      </table>
      `;
  
      NodeMailer.send(output, 'Votre liste de course pour votre stock !');
    }
    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};