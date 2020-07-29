const Express = require('express'),
      ProductController = require(`${process.cwd()}/api/controllers/product.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
    .route('/')
        .post(authorize([ADMIN, LOGGED_USER]), ProductController.add)
        .get(authorize([ADMIN, LOGGED_USER]), ProductController.findPaginate);

router
  .route('/pagination/:householdCode')
      .get(authorize([ADMIN, LOGGED_USER]), ProductController.findPaginate);

router
    .route('/:productId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold,ProductController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), ProductController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), ProductController.remove);

router
    .route('/delete-pagination/:productId')
        .delete(authorize([ADMIN, LOGGED_USER]), ProductController.removePagination);
//TODO créer middleware pour test le householdId

module.exports = router;