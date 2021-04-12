const router = require('express').Router(),
      TokenAuthController = require(`${process.cwd()}/api/controllers/token-auth.controller`);
 
router
  .route('/:tokenId')
    .post(TokenAuthController.createNewToken)
    .patch(TokenAuthController.updateUsedToken);

module.exports = router;
