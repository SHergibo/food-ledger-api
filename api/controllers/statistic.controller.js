const Product = require('./../models/product.model'),
      Household = require('./../models/household.model'),
      Boom = require('@hapi/boom');

/**
* GET Chart one data
*/
exports.chartOne = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
    const Products = await Product.find({ householdId: household._id });

    let data = {};

    Products.forEach(product => {
      product.expirationDate.forEach(date => {
        if(data[date.expDate.getFullYear()]){
          data[date.expDate.getFullYear()][date.expDate.getMonth()] = data[date.expDate.getFullYear()][date.expDate.getMonth()] + date.productLinkedToExpDate;
        }else{
          data[date.expDate.getFullYear()] = [0,0,0,0,0,0,0,0,0,0,0,0];
          data[date.expDate.getFullYear()][date.expDate.getMonth()] = date.productLinkedToExpDate;
        }
      });
    });
    
    return res.json(data);
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

