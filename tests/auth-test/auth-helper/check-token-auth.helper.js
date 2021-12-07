const Jwt = require('jwt-simple'),
      { jwtSecret } = require('../../../config/environment.config'),
      RefreshToken = require('../../../api/models/refresh-token.model');


const checkAuthAndRefreshToken = async ({tokenData, userId}) => {
  let objectReturn = {};
  let jwtDecoded = Jwt.decode(tokenData.accessToken, jwtSecret);
  jwtDecoded.sub === userId.toString() ? objectReturn.accessToken = true : objectReturn.accessToken = false;

  tokenData.tokenType === "Bearer" ? objectReturn.type = true : objectReturn.type = false;

  let refreshToken = await RefreshToken.findById(tokenData.refreshToken._id);
  refreshToken ? objectReturn.refreshToken = true : objectReturn.refreshToken = false;

  return objectReturn;
};

module.exports.checkTokenDataAuth = async ({tokenData, userId}) => {
  let objectReturn = await checkAuthAndRefreshToken({tokenData: tokenData.token, userId});

  tokenData.user._id.toString() === userId.toString() ? objectReturn.user = true : objectReturn.user = false;

  return objectReturn;
};

module.exports.checkRefreshToken = async ({tokenData, userId}) => {
  return await checkAuthAndRefreshToken({tokenData: tokenData, userId});
};