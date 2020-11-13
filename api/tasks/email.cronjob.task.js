const HouseHold = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Option = require('./../models/option.model'),
      Moment = require('moment');

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
                    //recherche si il y à des courses et si oui nodemailer
                  break;
                case 1:
                  if(numberWeek % 2 === 0){
                    //recherche si il y à des courses et si oui nodemailer
                  }
                  break;
                case 2:
                  if(numberWeek % 2 !== 0){
                    //recherche si il y à des courses et si oui nodemailer
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

exports.globalEmail = async () => {
  try {
    let today = new Date();

    //Si le premier jour du mois est un dimanche (donc envoi de shoppingList et globalEmail dans le même mail).
    if(today.getDay() === 0){
      //logique mail pour shoppingList et globalMail
    }else{
      //logique mail globalMail

      //checker si shoppingList est à envoyer tous les mois et rajouter la logique ici
    }
  } catch (error) {
    console.log(error);
  }
};
