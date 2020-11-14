const { data } = require('../../config/logger.config');
const HouseHold = require('./../models/household.model'),
      Option = require('./../models/option.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Product = require('./../models/product.model'),
      Moment = require('moment'),
      NodeMailer = require('./../../api/helpers/nodemailer.helper');

const findShoppingListAndMailIt = async (householdId) => {
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

    //NodeMailer.send(output, 'Votre liste de course pour votre stock !');
  }
}

exports.shoppingListEmail = async () => {
  try {
    let today = new Date();

    if(today.getDate() !== 1){
      let households = await HouseHold.find({});
      households.forEach(household => {
        let members = household.member;
        members.forEach(async (member) => {
          try {
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
          } catch (error) {
            //TODO ajouter les erreurs dans un log.
            console.log(error);
          }
        });
      });
    }else{
      return;
    }
  } catch (error) {
    console.log(error);
  }
};

const findProductAndMailIt = async (householdId, warningExpirationDate) => {
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();
  let products = await Product.find({householdId : householdId}).populate('brand', "brandName");
  let productExpirationDate = [];
  let warningDate;
  
  switch (warningExpirationDate) {
    case 0:
      warningDate = new Date(`${month}/01/${year}`);
      break;
    case 1:
      if(month === 11){
        warningDate = new Date(`01/01/${year + 1}`);
      }else{
        warningDate = new Date(`${month + 1}/01/${year}`);
      }
      break;
    case 2:
      if(month === 11){
        warningDate = new Date(`01/01/${year + 1}`);
      }else if (month === 12){
        warningDate = new Date(`02/01/${year + 1}`);
      }else{
        warningDate = new Date(`${month + 2}/01/${year}`);
      }
       
      break;
  
    default:
      break;
  }

  if(products.length >= 1){

    products.forEach(product => {
      product.expirationDate.forEach(date => {
        // console.log(date.expDate.getYear());
        if(date.expDate <= warningDate ){
          // console.log(date);
          //TODO !!!! problème avec la warningDate, il faut que la date soit le 01 du mois d'après
        }
      });
    });

    // let list = shoppingList.map(shopping => {
    //   return `<li>${shopping.product.name} - ${shopping.product.brand.brandName.label} - ${shopping.product.weight}gr - ${shopping.numberProduct}</li>`;
    // }).join('');

    // let output = `<h2>Voici votre liste de course à faire pour votre stock<h2>
    //   <ul>
    //   ${list}
    //   </ul>
    // `;

    //NodeMailer.send(output, 'Votre liste de course pour votre stock !');
  }
}

exports.globalEmail = async () => {
  try {
    let today = new Date();
    let sendEveryTwoMonth = [1, 3, 5, 7, 9, 11];
    let sendEveryTreeMonth = [0, 3, 6, 9];
    let households = await HouseHold.find({});
    //Si le premier jour du mois est un dimanche (donc envoi de shoppingList et globalEmail dans le même mail).
    if(today.getDay() === 0){
      //logique mail pour shoppingList et globalMail
    }else{
      
      households.forEach(household => {
        let members = household.member;
        members.forEach(async (member) => {
          try {
            let option = await Option.findOne({userId : member.userId});
            if(option.sendMailGlobal){
              switch (option.dateMailShoppingList.value) {
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
          }catch(error){
            console.log(error)
          }
        });
      });

      //checker si shoppingList est à envoyer tous les mois et rajouter la logique ici
    }
  } catch (error) {
    console.log(error);
  }
};
