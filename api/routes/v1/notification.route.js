const Express = require('express'),
      NotificationController = require(`${process.cwd()}/api/controllers/notification.controller`);



const router = Express.Router();

router
    .route('/:userId')
        .get( NotificationController.findAll);

router
    .route('/:notificationId')
        .delete( NotificationController.remove);


module.exports = router;