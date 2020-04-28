const Express = require('express'),
      HouseholdController = require(`${process.cwd()}/api/controllers/household.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
    .route('/')
        // .get(HouseholdController.findAll)
        .post(HouseholdController.add);

router
    .route('/:householdId')
        .get(authorize([ADMIN, LOGGED_USER]), HouseholdController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), HouseholdController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), HouseholdController.remove);

module.exports = router;