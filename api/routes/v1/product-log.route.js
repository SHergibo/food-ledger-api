const router = require('express').Router(),
      ProductLogController = require(`${process.cwd()}/api/controllers/product-log.controller`),
      { authorize, ADMIN } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'); 

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