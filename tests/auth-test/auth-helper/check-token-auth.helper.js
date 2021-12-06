const Jwt = require('jwt-simple'),
      { jwtSecret } = require('../../../config/environment.config'),
      RefreshToken = require('../../../api/models/refresh-token.model');

module.exports.checkTokenDataAuth = async ({tokenData, userId}) => {
  let objectReturn = {};
  let jwtDecoded = Jwt.decode(tokenData.token.accessToken, jwtSecret);
  jwtDecoded.sub === userId.toString() ? objectReturn.accessToken = true : objectReturn.accessToken = false;

  tokenData.token.tokenType === "Bearer" ? objectReturn.type = true : objectReturn.type = false;

  let refreshToken = await RefreshToken.findById(tokenData.token.refreshToken._id);
  refreshToken ? objectReturn.refreshToken = true : objectReturn.refreshToken = false;

  tokenData.user._id.toString() === userId.toString() ? objectReturn.user = true : objectReturn.user = false;

  return objectReturn;
};