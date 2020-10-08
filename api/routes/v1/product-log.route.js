const Express = require('express'),
      ProductLogController = require(`${process.cwd()}/api/controllers/product-log.controller`);

const { authorize, ADMIN } = require('../../middlewares/auth.middleware');


const router = Express.Router();

router
  .route('/:householdCode')
    .get(authorize([ADMIN]), ProductLogController.findAll);

module.exports = router;