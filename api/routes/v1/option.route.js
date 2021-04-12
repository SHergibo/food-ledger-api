const router = require('express').Router(),
      OptionController = require(`${process.cwd()}/api/controllers/option.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), OptionController.findOne)
    .patch(authorize([ADMIN, LOGGED_USER]), OptionController.update);

module.exports = router;