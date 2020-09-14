const Express = require('express'),
      OptionController = require(`${process.cwd()}/api/controllers/option.controller`);

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
  .route('/:userId')
    .get(authorize([ADMIN, LOGGED_USER]), OptionController.findOne)
    .patch(authorize([ADMIN, LOGGED_USER]), OptionController.update);

module.exports = router;