const router = require('express').Router(),
      RequestController = require(`${process.cwd()}/api/controllers/request.controller`),
      { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');
 
router
  .route('/delegate-admin/:notificationId')
    .get(authorize([ADMIN, LOGGED_USER]), RequestController.switchAdminRequest);

router
  .route('/switch-admin-rights')
    .post(authorize([ADMIN, LOGGED_USER]), RequestController.switchAdminRights);

router
  .route('/switch-admin-rights-respond/:notificationId')
    .get(authorize([ADMIN, LOGGED_USER]), RequestController.switchAdminRightsRespond);

router
  .route('/add-user-request')
    .post(authorize([ADMIN, LOGGED_USER]), RequestController.addUserRequest);

router
  .route('/add-user-respond/:notificationId')
    .get(authorize([ADMIN, LOGGED_USER]), RequestController.addUserRespond);

module.exports = router;