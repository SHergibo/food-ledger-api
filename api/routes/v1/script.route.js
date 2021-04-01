const Express = require('express'),
      ScriptController = require(`${process.cwd()}/api/controllers/script.controller`);

const router = Express.Router();

router
    .route('/')
        .get(ScriptController.launch);
  

module.exports = router;