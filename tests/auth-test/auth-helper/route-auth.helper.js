const request = require("supertest"),
      app = require("../../../config/app.config"),
     { api } = require('../../../config/environment.config');

module.exports.basicRouteAuth = async ({userCredentials, route}) => {
  let sendedObject = {
    email :userCredentials.email
  };

  route !== "refresh-token" ? sendedObject["password"] = userCredentials.password : sendedObject["refreshToken"] = userCredentials.refreshToken;

  return await request(app)
  .post(`/api/${api}/auth/${route}`)
  .send(sendedObject);
};