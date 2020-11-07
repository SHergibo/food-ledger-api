const Express = require('express'),
      ProductLogController = require(`${process.cwd()}/api/controllers/product-log.controller`);

const { authorize, ADMIN } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN]), checkSameHousehold, ProductLogController.findPaginate);

router
  .route('/delete-pagination/:productLogId')
      .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.removePagination);
  
router
  .route('/:householdCode')
      .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.removeAll);

module.exports = router;