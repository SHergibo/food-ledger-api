const app = require("../config/app.config"),
      db = require('./db'),
      { port } = require('../config/environment.config');

module.exports.dbManagement = () => {
  beforeAll(async () => {
    await db.connect();
    app.listen(port);
  });

  afterEach(async () => await db.clearDatabase());

  afterAll(async () => {

    await db.closeDatabase();
    if(app.listening) app.close();
  });
};