const request = require("supertest"),
      app = require("../../../config/app.config"),
     { api } = require('../../../config/environment.config');

module.exports.basicRouteAuth = async ({userCredentials, route, accessToken}) => {
  let sendedObject = {
    email :userCredentials.email
  };

  if(route === "login" || route === "check-credential") sendedObject["password"] = userCredentials.password;
  if(route === "refresh-token") sendedObject["refreshToken"] = userCredentials.refreshToken;
  if(route === "logout" || route === "logoutAndRefresh") sendedObject["token"] = userCredentials.refreshToken;

  let header = {};
  if(accessToken){
   header = {'Authorization' : `Bearer ${accessToken}`};
  }

  return await request(app)
  .post(`/api/${api}/auth/${route}`)
  .send(sendedObject)
  .set(header);
};