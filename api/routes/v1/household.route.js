const router = require('express').Router(),
      HouseholdController = require(`${process.cwd()}/api/controllers/household.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware'),
      { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');

router
  .route('/')
    .post(HouseholdController.add);

router
  .route('/:householdId')
    .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HouseholdController.findOne);

router
  .route('/:householdId')
    .patch(authorize([ADMIN]), checkSameHousehold, HouseholdController.update);

router
  .route('/kick-user/:householdId')
    .patch(authorize([ADMIN]), checkSameHousehold, HouseholdController.kickUser);

module.exports = router;