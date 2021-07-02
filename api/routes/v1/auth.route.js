const router = require('express').Router(),
      AuthController = require(`${process.cwd()}/api/controllers/auth.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/login')
    .post(AuthController.login);

router
  .route('/refresh-token')
    .post(AuthController.refresh);

router
  .route('/logout')
    .post(authorize([ADMIN, LOGGED_USER]), AuthController.logout);

router
  .route('/logoutAndRefresh')
    .post(authorize([ADMIN, LOGGED_USER]), AuthController.logoutAndRefresh);

module.exports = router;