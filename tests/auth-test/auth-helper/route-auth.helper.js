const { routeRequest } = require('../../global-helper/routeRequest.helper');

module.exports.basicRouteAuth = async ({userCredentials, route, accessToken}) => {
  let sendedObject = {
    email :userCredentials.email
  };

  if(route === "login" || route === "check-credential") sendedObject["password"] = userCredentials.password;
  if(route === "refresh-token") sendedObject["refreshToken"] = userCredentials.refreshToken;
  if(route === "logout" || route === "logoutAndRefresh") sendedObject["token"] = userCredentials.refreshToken;

  return await routeRequest({route, sendedObject, accessToken, restType: "post"});
};