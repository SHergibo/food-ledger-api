const Express = require('express'),
      RequestController = require(`${process.cwd()}/api/controllers/request.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
    .route('/:notificationId')
        .get(/*authorize([ADMIN, LOGGED_USER]),*/ RequestController.applyRequest);

module.exports = router;