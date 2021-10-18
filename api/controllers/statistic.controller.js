const { getChartData } = require('../helpers/chartData.helper'),
      Boom = require('@hapi/boom');

/**
* GET Chart data
*/
exports.chartData = async (req, res, next) => {
  try {
    let dataChart = await getChartData({householdId : req.params.householdId});
    return res.json(dataChart);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};