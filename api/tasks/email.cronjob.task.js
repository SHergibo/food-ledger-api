const HouseHold = require('./../models/household.model'),
      Option = require('./../models/option.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Product = require('./../models/product.model'),
      Moment = require('moment'),
      NodeMailer = require('./../../api/helpers/nodemailer.helper'),
      { loggerError } = require('./../../config/logger.config');

const findShoppingListAndMailIt = async (householdId) => {
  try {
    let shoppingList = await ShoppingList.find({householdId : householdId})
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
  
      let output = `<h2>Voici votre liste de course à faire pour votre stock<h2>
        <ul>
        ${list}
        </ul>
      `;
  
      NodeMailer.send(output, 'Votre liste de course pour votre stock !');
    }
  } catch (error) {
    loggerError.error(error);
  }
};

exports.shoppingListEmail = async () => {
  try {
    let today = new Date();
    let households = await HouseHold.find({});
    households.forEach(household => {
      let members = household.member;
      members.forEach(async (member) => {
        let option = await Option.findOne({userId : member.userId});
        if(option.sendMailShoppingList){
          let numberWeek = Moment(today, "DDMMYYYY").isoWeek();
          switch (option.dateMailShoppingList.value) {
            case 0:
              findShoppingListAndMailIt(household._id);
              break;
            case 1:
              if(numberWeek % 2 === 0){
                findShoppingListAndMailIt(household._id);
              }
              break;
            case 2:
              if(numberWeek % 2 !== 0){
                findShoppingListAndMailIt(household._id);
              }
              break;
          
            default:
              break;
          }
        }else{
          return;
        }
      });
    });
  } catch (error) {
    loggerError.error(error);
  }
};

const findProductAndMailIt = async (householdId, warningExpirationDate) => {
  try {
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    let products = await Product.find({householdId : householdId}).populate('brand', "brandName");
    let productExpirationDate = [];
    let warningDate;
    
    switch (warningExpirationDate) {
      case 0:
        if(month === 12){
          warningDate = new Date(`01/01/${year + 1}`);
        }else{
          warningDate = new Date(`${month + 1}/01/${year}`);
        }
        break;
      case 1:
        if(month === 11){
          warningDate = new Date(`02/01/${year + 1}`);
        }else if (month === 12){
          warningDate = new Date(`03/01/${year + 1}`);
        }else{
          warningDate = new Date(`${month + 2}/01/${year}`);
        }
        break;
      case 2:
        if(month === 11){
          warningDate = new Date(`03/01/${year + 1}`);
        }else if (month === 12){
          warningDate = new Date(`04/01/${year + 1}`);
        }else{
          warningDate = new Date(`${month + 3}/01/${year}`);
        }
        break;
    
      default:
        break;
    }

    if(products.length >= 1){

      await products.forEach(product => {
        product.expirationDate.forEach(date => {
          if(date.expDate < warningDate ){
            let searchProduct = productExpirationDate.find(productInArray => productInArray.id === product._id)
            if(searchProduct){
              searchProduct.expirationDate.push({
                expDate: date.expDate,
                number: date.productLinkedToExpDate
              });
            }else{
              let productObject = {
                id: product._id,
                name: product.name,
                brand: product.brand.brandName.label,
                expirationDate: [{
                  expDate: date.expDate,
                  number: date.productLinkedToExpDate
                }]
              };
              productExpirationDate = [...productExpirationDate, productObject];
            }
          }
        });
      });

      if(productExpirationDate.length >= 1){    
        let list = productExpirationDate.map(product => {
        let numberProduct = 0;
        let listDate = product.expirationDate.map(expDateObject => {
          numberProduct += expDateObject.number;
          return `<li>${Moment(expDateObject.expDate).format("DD-MM-YYYY")} - nombre ${expDateObject.number}</li>`;
        }).join('');
          return `<li>${product.name} - ${product.brand} - x ${numberProduct}</li> <ul>${listDate}</ul>`;
        }).join('');
    
        let output = `<h2>Voici la liste des produits de votre stock bientôt périmés !<h2>
          <ul>
          ${list}
          </ul>
        `;

        NodeMailer.send(output, 'Vous avez des produits proches de leur date de péremptions !');
      }
    }
  } catch (error) {
    loggerError.error(error);
  }
};

exports.globalEmail = async () => {
  try {
    let today = new Date();
    let sendEveryTwoMonth = [1, 3, 5, 7, 9, 11];
    let sendEveryTreeMonth = [0, 3, 6, 9];
    let households = await HouseHold.find({});
  
    households.forEach(household => {
      let members = household.member;
      members.forEach(async (member) => {
        let option = await Option.findOne({userId : member.userId});

        if(!option.sendMailGlobal && !option.sendMailShoppingList) return;

        if(option.sendMailGlobal){
          switch (option.dateMailGlobal.value) {
            case 0:
              findProductAndMailIt(household._id, option.warningExpirationDate.value);
              break;
            case 1:
              if(sendEveryTwoMonth.includes(today.getMonth())){
                findProductAndMailIt(household._id, option.warningExpirationDate.value);
              }
              break;
            case 2:
              if(sendEveryTreeMonth.includes(today.getMonth())){
                findProductAndMailIt(household._id, option.warningExpirationDate.value);
              }
              break;
          
            default:
              break;
          }
        }

        if(option.sendMailShoppingList){
          if(option.dateMailShoppingList.value === 3){
            findShoppingListAndMailIt(household._id);
          }
        }
      });
    });
    
  } catch (error) {
    loggerError.error(error);
  }
};
