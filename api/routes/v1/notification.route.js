const Express = require('express'),
      NotificationController = require(`${process.cwd()}/api/controllers/notification.controller`);



const router = Express.Router();

router
    .route('/:userId')
        .get( NotificationController.findAll);

router
    .route('/test-notif/:userId')
        .get(NotificationController.testSocket);


module.exports = router;