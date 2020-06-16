const Express = require('express'),
      RequestController = require(`${process.cwd()}/api/controllers/request.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
    .route('/switch-admin/:notificationId')
        .get(/*authorize([ADMIN, LOGGED_USER]),*/ RequestController.switchAdminRequest);

router
    .route('/add-user-request')
        .post(/*authorize([ADMIN, LOGGED_USER]),*/ RequestController.addUserRequest);

router
    .route('/add-user-respond')
        .get(/*authorize([ADMIN, LOGGED_USER]),*/ RequestController.addUserRespond);

module.exports = router;