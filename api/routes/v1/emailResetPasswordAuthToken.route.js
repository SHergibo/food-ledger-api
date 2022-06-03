const Express = require("express"),
  EmailResetPasswordAuthToken = require(`${process.cwd()}/api/controllers/emailResetPasswordAuthToken.controller`);

const router = Express.Router();

router
  .route("/")
  .post(EmailResetPasswordAuthToken.createEmailResetPasswordAuthToken);

router.route("/:tokenId").patch(EmailResetPasswordAuthToken.resetUserPassword);

module.exports = router;
