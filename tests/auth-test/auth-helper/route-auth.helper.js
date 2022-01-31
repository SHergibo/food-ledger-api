const { routeRequest } = require("../../global-helper/routeRequest.helper");

module.exports.basicRouteAuth = async ({
  userCredentials,
  route,
  accessToken,
}) => {
  let sendedObject = {
    email: userCredentials.email,
  };

  if (route === "auth/login" || route === "auth/check-credential")
    sendedObject["password"] = userCredentials.password;
  if (route === "auth/refresh-token")
    sendedObject["refreshToken"] = userCredentials.refreshToken;
  if (route === "auth/logout" || route === "auth/logout-and-refresh")
    sendedObject["token"] = userCredentials.refreshToken;

  return await routeRequest({
    route,
    sendedObject,
    accessToken,
    restType: "post",
  });
};
