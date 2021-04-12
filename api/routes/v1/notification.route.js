const router = require('express').Router(),
      NotificationController = require(`${process.cwd()}/api/controllers/notification.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findAll);

router
  .route('/:notificationId')
    .delete(authorize([ADMIN, LOGGED_USER]), NotificationController.remove);

module.exports = router;