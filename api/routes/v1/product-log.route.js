const router = require('express').Router(),
      ProductLogController = require(`${process.cwd()}/api/controllers/product-log.controller`),
      { authorize, ADMIN } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'); 

router
  .route('/pagination/:householdId')
    .get(authorize([ADMIN]), checkSameHousehold, ProductLogController.findPaginate);

router
  .route('/:productLogId')
    .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.remove);
  
router
  .route('/delete-all/:householdId')
    .delete(authorize([ADMIN]), checkSameHousehold, ProductLogController.removeAll);

module.exports = router;