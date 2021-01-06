const Express = require('express'),
      HistoricController = require(`${process.cwd()}/api/controllers/historic.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { addHousehold } = require('../../middlewares/addHousehold.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
    .route('/')
        .post(authorize([ADMIN, LOGGED_USER]), addHousehold, HistoricController.add);

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findPaginate);
      
router
    .route('/:historicId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), addHousehold, checkSameHousehold, HistoricController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.remove);

router
    .route('/delete-pagination/:historicId')
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.removePagination);

router
    .route('/download/:householdCode')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HistoricController.download);

module.exports = router;