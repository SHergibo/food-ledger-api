const request = require("supertest"),
      app = require("./../config/app.config"),
      { api } = require('./../config/environment.config');

module.exports.login = async (email, password) => {
  const login = await request(app)
  .post(`/api/${api}/auth/login`)
  .send({
    email : email,
    password: password
  });

  return login.body.token.accessToken;
};