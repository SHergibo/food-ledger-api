const Express = require('express'),
      AuthController = require(`${process.cwd()}/api/controllers/auth.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

const router = Express.Router();

router
    .route('/register')
        .post(AuthController.register);

router
    .route('/login')
        .post(AuthController.login);

router
    .route('/refresh-token')
        .post(AuthController.refresh);

router
    .route('/logout')
        .post(authorize([ADMIN, LOGGED_USER]), AuthController.logout);

module.exports = router;