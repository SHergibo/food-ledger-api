const router = require('express').Router(),
      BrandController = require(`${process.cwd()}/api/controllers/brand.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware'),
      { isWaiting } = require('../../middlewares/isWaiting.middleware');

router
  .route('/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, BrandController.findAll)

router
  .route('/:brandId')
    .patch(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, BrandController.update)
    .delete(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, isWaiting, BrandController.remove);

module.exports = router;