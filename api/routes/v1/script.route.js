const Express = require('express'),
      ScriptController = require(`${process.cwd()}/api/controllers/script.controller`);

const router = Express.Router();

router
    .route('/launch')
        .get(ScriptController.launch);

router
    .route('/householdMember')
        .get(ScriptController.householdMember);
  

module.exports = router;