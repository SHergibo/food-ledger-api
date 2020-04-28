const Express = require('express'),
      UserController = require(`${process.cwd()}/api/controllers/user.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
    .route('/')
        // .get(UserController.findAll)
        .post(UserController.add);

router
    .route('/:userId')
        .get(authorize([ADMIN, LOGGED_USER]), UserController.findOne)
        .patch(authorize([ADMIN, LOGGED_USER]), UserController.update)
        .delete(authorize([ADMIN, LOGGED_USER]), UserController.remove);

module.exports = router;