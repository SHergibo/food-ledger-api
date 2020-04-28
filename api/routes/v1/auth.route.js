const Express = require('express'),
      AuthController = require(`${process.cwd()}/api/controllers/auth.controller`);

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
        .post(AuthController.logout);

module.exports = router;