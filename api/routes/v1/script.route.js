const router = require('express').Router(),
      ScriptController = require(`${process.cwd()}/api/controllers/script.controller`);
 
router
  .route('/launch')
  .get(ScriptController.launch);

router
  .route('/householdMember')
  .get(ScriptController.householdMember);

router
  .route('/testNotifSocketIo')
  .get(ScriptController.testNotifSocketIo);

module.exports = router;