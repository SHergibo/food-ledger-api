const Express = require('express'),
      StatisticController = require(`${process.cwd()}/api/controllers/statistic.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
  .route('/chart-data/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, StatisticController.chartData);


module.exports = router;