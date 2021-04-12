const router = require('express').Router(),
      StatisticController = require(`${process.cwd()}/api/controllers/statistic.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),       
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');
 
router
  .route('/chart-data/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, StatisticController.chartData);

module.exports = router;