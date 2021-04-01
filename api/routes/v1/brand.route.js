const Express = require('express'),
      BrandController = require(`${process.cwd()}/api/controllers/brand.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');


const router = Express.Router();

router
    .route('/:householdId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, BrandController.findAll)
  
router
    .route('/:brandId')
        .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, BrandController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, BrandController.remove);


module.exports = router;