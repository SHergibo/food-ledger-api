const app = require("../config/app.config"),
      db = require('./db'),
      { port } = require('../config/environment.config');

module.exports.dbManagement = () => {
  beforeAll(async (done) => {
    await db.connect();
    app.listen(port, ()=> done());
  });

  afterEach(async () => await db.clearDatabase());

  afterAll(async (done) => {
    await db.closeDatabase();
    app.listening ? app.close(() => done()) : done();
  });
};