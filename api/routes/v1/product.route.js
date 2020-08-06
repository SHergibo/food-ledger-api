const Express = require('express'),
      ProductController = require(`${process.cwd()}/api/controllers/product.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { addProductHousehold } = require('../../middlewares/addProductHousehold.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
    .route('/')
        .post(authorize([ADMIN, LOGGED_USER]), addProductHousehold, ProductController.add);

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findPaginate);
      
router
    .route('/:productId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.remove);

router
    .route('/delete-pagination/:productId')
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, ProductController.removePagination);

module.exports = router;