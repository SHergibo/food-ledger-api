const router = require('express').Router(),
      HistoricController = require(`${process.cwd()}/api/controllers/historic.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'),
      { outdatedStatistics } = require('../../middlewares/statisticOutdated.middleware'),
      { isWaiting } = require('../../middlewares/isWaiting.middleware');

router
  .route('/')
    .post(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, HistoricController.add);

router
  .route('/pagination/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findPaginate);

router
  .route('/:historicId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findOne)
    .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, outdatedStatistics, HistoricController.update)
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, HistoricController.remove);

router
  .route('/download/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.download);

module.exports = router;