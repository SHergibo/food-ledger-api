const router = require('express').Router(),
      ProductController = require(`${process.cwd()}/api/controllers/product.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'),
      { outdatedStatistics } = require('../../middlewares/statisticOutdated.middleware'),
      { isWaiting } = require('../../middlewares/isWaiting.middleware');
 
router
  .route('/')
    .post(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, outdatedStatistics, ProductController.add);

router
  .route('/pagination/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findPaginate);

router
  .route('/:productId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findOne)
    .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, outdatedStatistics, ProductController.update)
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, outdatedStatistics, ProductController.remove);

router
  .route('/delete-pagination/:productId')
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, outdatedStatistics, ProductController.removePagination);

router
  .route('/download/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.download);

module.exports = router;