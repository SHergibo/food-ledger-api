const router = require('express').Router(),
      NotificationController = require(`${process.cwd()}/api/controllers/notification.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findAll);

router
  .route('/pagination-notification-received/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findPaginateNotifReceived);

router
  .route('/pagination-notification-sended/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findPaginateNotifSended);

router
  .route('/:notificationId')
    .delete(authorize([ADMIN, LOGGED_USER]), NotificationController.remove);

module.exports = router;