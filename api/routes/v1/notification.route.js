const router = require('express').Router(),
      NotificationController = require(`${process.cwd()}/api/controllers/notification.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');

router
  .route('/received-notification/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findAllReceivedNotif);

router
  .route('/sended-notification/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findAllSendedNotif);

router
  .route('/pagination-received-notification/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findPaginateReceivedNotif);

router
  .route('/pagination-sended-notification/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), NotificationController.findPaginateSendedNotif);

router
  .route('/:notificationId')
    .delete(authorize([ADMIN, LOGGED_USER]), NotificationController.remove);

module.exports = router;