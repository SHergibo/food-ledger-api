const Express = require('express'),
      HouseholdController = require(`${process.cwd()}/api/controllers/household.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHousehold.middleware');


const router = Express.Router();

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