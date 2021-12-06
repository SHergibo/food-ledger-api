const request = require("supertest"),
      app = require("../../../config/app.config"),
     { api } = require('../../../config/environment.config');

module.exports.basicRouteAuth = async ({userCredentials, route}) => {
  return await request(app)
  .post(`/api/${api}/auth/${route}`)
  .send({
    password : userCredentials.password,
    email :userCredentials.email
  });
};