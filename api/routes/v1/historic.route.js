const Express = require('express'),
      HistoricController = require(`${process.cwd()}/api/controllers/historic.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');
const { outdatedStatistics } = require('../../middlewares/statisticOutdated.middleware');


const router = Express.Router();

router
    .route('/')
        .post(authorize([ADMIN, LOGGED_USER]), HistoricController.add);

router
  .route('/pagination/:householdId')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findPaginate);
      
router
    .route('/:historicId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, outdatedStatistics, HistoricController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.remove);

router
    .route('/delete-pagination/:historicId')
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.removePagination);

router
    .route('/download/:householdId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.download);

module.exports = router;