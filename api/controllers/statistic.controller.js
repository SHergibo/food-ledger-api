const Statistic = require('./../models/statistic.model'),
      Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      Moment = require('moment');
      Boom = require('@hapi/boom');

/**
* GET Chart data
*/
exports.chartData = async (req, res, next) => {
  try {
    
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    let statistic = await Statistic.findOne({ householdId: household._id });
    const products = await Product.find({ householdId: household._id });

    if(!statistic || statistic.isOutdated === true){
      let dataFinal = {};
      let dataChartOne = {};
      let productType = ['legume', 'viande', 'poisson', 'fruit', 'boisson', 'produit-sucre', 'produit-laitier', 'farineux', 'cereale', 'legumineuse'];
      let dataChartTwo = [0,0,0,0,0,0,0,0,0,0];
      let dataChartThree = [0,0,0,0,0,0,0,0,0,0];
      let dataChartFour = {};
      let totalProduct = 0;
  
      products.forEach(product => {
        //data for chart one
        product.expirationDate.forEach(date => {
          totalProduct = totalProduct + date.productLinkedToExpDate;
          if(dataChartOne[date.expDate.getFullYear()]){
            dataChartOne[date.expDate.getFullYear()][date.expDate.getMonth()] = dataChartOne[date.expDate.getFullYear()][date.expDate.getMonth()] + date.productLinkedToExpDate;
          }else{
            dataChartOne[date.expDate.getFullYear()] = [0,0,0,0,0,0,0,0,0,0,0,0];
            dataChartOne[date.expDate.getFullYear()][date.expDate.getMonth()] = date.productLinkedToExpDate;
          }
        });
  
        let indexProductType = productType.indexOf(product.type.value);
        //data for chart two
        dataChartTwo[indexProductType] = dataChartTwo[indexProductType] + product.number;
  
        //data for chart three
        dataChartThree[indexProductType] = dataChartThree[indexProductType] + (product.number * product.kcal);
  
      });
  
      //data for chart Four
      let getYear = new Date().getFullYear();
      let currentYear;
      if(!statistic){
        currentYear = [...Array(Moment().isoWeeksInYear()).fill(0)];
        currentYear[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
        dataChartFour[getYear] = currentYear;
      }else{
        dataChartFour = statistic.statistics.chartFour;
        if(dataChartFour[getYear]){
          currentYear = dataChartFour[getYear]
        }else{
          currentYear = [...Array(Moment().isoWeeksInYear()).fill(0)];
        }
        currentYear[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
        dataChartFour[getYear] = currentYear;
      }

      dataFinal["chartOne"] = dataChartOne;
      dataFinal["chartTwo"] = dataChartTwo;
      dataFinal["chartThree"] = dataChartThree;
      dataFinal["chartFour"] = dataChartFour;
  
      if(!statistic){
        let stat = {
          statistics : dataFinal,
          householdId: household._id
        }
    
        statistic = new Statistic(stat);
        await statistic.save();
      }
      if(statistic.isOutdated === true){
        statistic = await Statistic.findByIdAndUpdate(statistic._id, {statistics : dataFinal, isOutdated : false}, { override: true, upsert: true, new: true });
      }
    }

    if(statistic && !statistic.isOutdated && !statistic.statistics.chartFour[new Date().getFullYear()]){
      let totalProduct = 0;
      products.forEach(product => {
        product.expirationDate.forEach(date => {
          totalProduct = totalProduct + date.productLinkedToExpDate;
        });
      });

      let dataChartFour = statistic.statistics.chartFour;
      let currentYear = [...Array(Moment().isoWeeksInYear()).fill(0)];
      currentYear[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
      dataChartFour[new Date().getFullYear()] = currentYear;

      statistic = await Statistic.findByIdAndUpdate(statistic._id, {"statistics.chartFour" : dataChartFour}, { override: true, upsert: true, new: true });
    }
    
    return res.json(statistic.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};