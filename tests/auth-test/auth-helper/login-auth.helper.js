const request = require("supertest"),
      app = require("../../../config/app.config"),
     { api } = require('../../../config/environment.config');

module.exports.loginAuth = async ({userCredentials}) => {
  return await request(app)
  .post(`/api/${api}/auth/login`)
  .send({
    password : userCredentials.password,
    email :userCredentials.email
  });
};