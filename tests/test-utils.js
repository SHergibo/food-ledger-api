const request = require("supertest");
const app = require("./../config/app.config");
const db = require('./db');
const { port, api } = require('./../config/environment.config');

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

module.exports.login = async (email, password) => {
  const login = await request(app)
  .post(`/api/${api}/auth/login`)
  .send({
    email : email,
    password: password
  });

  return login.body.token.accessToken;
};