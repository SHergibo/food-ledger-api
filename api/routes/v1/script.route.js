const router = require('express').Router(),
      ScriptController = require(`${process.cwd()}/api/controllers/script.controller`);
 
router
  .route('/launch')
  .get(ScriptController.launch);

module.exports = router;