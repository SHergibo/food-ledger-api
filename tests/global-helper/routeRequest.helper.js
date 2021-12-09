const request = require("supertest"),
      app = require("../../config/app.config"),
     { api } = require('../../config/environment.config');

module.exports.routeRequest = async ({route, sendedObject, accessToken, restType}) => {
  let header = {};
  if(accessToken){
   header = {'Authorization' : `Bearer ${accessToken}`};
  }

  return await request(app)
  [restType](`/api/${api}/auth/${route}`)
  .send(sendedObject)
  .set(header);
};