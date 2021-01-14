const Express = require('express'),
      ProductController = require(`${process.cwd()}/api/controllers/product.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { addHousehold } = require('../../middlewares/addHousehold.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');
const { outdatedStatistics } = require('../../middlewares/statisticOutdated.middleware');


const router = Express.Router();

router
    .route('/')
        .post(authorize([ADMIN, LOGGED_USER]), addHousehold, outdatedStatistics, ProductController.add);

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findPaginate);
      
router
    .route('/:productId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), addHousehold, checkSameHousehold, outdatedStatistics, ProductController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, outdatedStatistics, ProductController.remove);

router
    .route('/delete-pagination/:productId')
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, outdatedStatistics, ProductController.removePagination);

router
    .route('/download/:householdCode')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.download);

module.exports = router;