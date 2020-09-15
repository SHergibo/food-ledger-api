const Express = require('express'),
      HouseholdController = require(`${process.cwd()}/api/controllers/household.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
const { checkSameHousehold } = require('../../middlewares/sameHouseholdCode.middleware');


const router = Express.Router();

router
    .route('/')
        .post(HouseholdController.add);

router
    .route('/:householdId')
        .get(authorize([ADMIN, LOGGED_USER]), checkSameHousehold, HouseholdController.findOne)
        .patch(authorize([ADMIN]), checkSameHousehold, HouseholdController.update);

module.exports = router;