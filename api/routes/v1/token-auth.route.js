const Express = require('express'),
      TokenAuthController = require(`${process.cwd()}/api/controllers/token-auth.controller`);


const router = Express.Router();

router
    .route('/:tokenId')
    .post(TokenAuthController.createNewToken)
    .patch(TokenAuthController.updateUsedToken);


module.exports = router;
