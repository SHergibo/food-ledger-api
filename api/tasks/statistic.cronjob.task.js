const HouseHold = require('./../models/household.model'),
      Product = require('./../models/product.model'),
      Statistic = require('./../models/statistic.model'),
      Moment = require('moment'),
      NodeMailer = require('./../../api/helpers/nodemailer.helper'),
      { loggerError } = require('./../../config/logger.config');

exports.statisticChartFour = async () => {
  try {
    let households = await HouseHold.find({});
    let dataChartFour = {};
    households.forEach(async (household) => {
      let products = await Product.find({ householdId: household._id });
      let statistic = await Statistic.findOne({ householdId: household._id });
      if(products.length >= 1){
        let totalProduct = 0;
        products.forEach(product => {
          product.expirationDate.forEach(date => {
            totalProduct = totalProduct + date.productLinkedToExpDate;
          });
        });

        let getYear = new Date().getFullYear();
        let currentYear;
        if(!statistic){
          currentYear = [...Array(Moment().isoWeeksInYear()).fill(0)];
          currentYear[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
          dataChartFour[getYear] = currentYear;

          let stat = {
            statistics : {
              chartFour: dataChartFour,
            },
            householdId: household._id
          }
      
          statistic = new Statistic(stat);
          await statistic.save();

        }else{
          dataChartFour = statistic.statistics.chartFour;
          if(dataChartFour[getYear]){
            currentYear = dataChartFour[getYear]
          }else{
            currentYear = [...Array(Moment().isoWeeksInYear()).fill(0)];
          }
          currentYear[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
          dataChartFour[getYear] = currentYear;

          statistic = await Statistic.findByIdAndUpdate(statistic._id, {"statistics.chartFour" : dataChartFour}, { override: true, upsert: true, new: true });
        }
      }
    });

  } catch (error) {
    loggerError.error(error);
    NodeMailer.send(error, 'Une erreur est survenue dans la fonction statisticChartFour !');
  }
};