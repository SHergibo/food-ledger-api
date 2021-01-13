const Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      Moment = require('moment');
      Boom = require('@hapi/boom');

/**
* GET Chart data
*/
exports.chartData = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const Products = await Product.find({ householdId: household._id });

    let dataFinal = {};
    let dataChartOne = {};
    let productType = ['legume', 'viande', 'poisson', 'fruit', 'boisson', 'produit-sucre', 'produit-laitier', 'farineux', 'cereale', 'legumineuse'];
    let dataChartTwo = [0,0,0,0,0,0,0,0,0,0];
    let dataChartThree = [0,0,0,0,0,0,0,0,0,0];
    let dataChartFour = {};
    let totalProduct = 0;

    Products.forEach(product => {
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

    //!!!! Si on créer pour la première fois l'object ou qu'on est dans une nouvelle année !!!!
    //data for chart Four
    let getYear = new Date().getFullYear();
    let newWeekInYearArray = [...Array(Moment().isoWeeksInYear()).fill(0)];
    newWeekInYearArray[Moment(new Date(), "MMDDYYYY").isoWeek() - 1] = totalProduct;
    dataChartFour[getYear] = newYearArray;


    dataFinal["chartOne"] = dataChartOne;
    dataFinal["chartTwo"] = dataChartTwo;
    dataFinal["chartThree"] = dataChartThree;
    dataFinal["chartFour"] = dataChartFour;
    console.log(dataFinal);
    return res.json(dataFinal);
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};