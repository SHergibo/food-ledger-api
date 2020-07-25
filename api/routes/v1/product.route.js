const Express = require('express'),
      ProductController = require(`${process.cwd()}/api/controllers/product.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
    .route('/')
        .post(/*authorize([ADMIN, LOGGED_USER]),*/ ProductController.add)
        .get(authorize([ADMIN, LOGGED_USER]), ProductController.findPaginate);

router
  .route('/:householdCode')
      .get(/*authorize([ADMIN, LOGGED_USER]),*/ ProductController.findPaginate);

router
    .route('/:productId')
        .get(/*authorize([ADMIN, LOGGED_USER]),*/ ProductController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), ProductController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), ProductController.remove);
//TODO créer middleware pour test le householdId

module.exports = router;