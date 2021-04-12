const router = require('express').Router(),
      UserController = require(`${process.cwd()}/api/controllers/user.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/')
    .post(UserController.add);

router
  .route('/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), UserController.findOne)
    .patch(authorize([ADMIN, LOGGED_USER]), UserController.update)
    .delete(authorize([ADMIN, LOGGED_USER]), UserController.remove);

module.exports = router;