const Express = require('express'),
      ProductLogController = require(`${process.cwd()}/api/controllers/product-log.controller`);

const { authorize, ADMIN } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');


const router = Express.Router();

router
  .route('/pagination/:householdId')
      .get(authorize([ADMIN]), checkSameHousehold, ProductLogController.findPaginate);

router
  .route('/delete-pagination/:productLogId')
      .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.removePagination);
  
router
  .route('/:householdId')
      .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.removeAll);

module.exports = router;