const User = require('./../models/user.model'),
      RefreshToken = require('./../models/refresh-token.model'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      Moment = require('moment-timezone');

const { jwtExpirationInterval } = require('./../../config/environment.config');


/**
* Build a token response and return it
*
* @param {Object} user
* @param {String} accessToken
*
* @returns A formated object with tokens
*
* @private
*/

const _generateTokenResponse = function (user, accessToken) {
  const tokenType = "Bearer";
  const refreshToken = RefreshToken.generate(user);
  const expiresIn = Moment().add(jwtExpirationInterval, 'minutes');
  return { tokenType, accessToken, refreshToken, expiresIn };
};

/**
 * Connect user if valid username and password is provided
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * 
 * @return JWT|next
 * 
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const checkRole = await User.findOne({email : req.body.email});
    if(checkRole.role !== "ghost"){
      const { user, accessToken } = await User.findAndGenerateToken(req.body);
      const token = _generateTokenResponse(user, accessToken);
      return res.json({ token, user: user.transform() });
    }else{
      return next(Boom.forbidden('Please, verify your account first'));
    }
    
  } catch (error) {
    //console.log("controller login------------", error);
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
 * Refresh JWT token by RefreshToken removing, and re-creating 
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * 
 * @return JWT|next
 * 
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    //console.log("body-refresh", req.body);
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndDelete({
      userEmail: email,
      token: refreshToken
    });
    //console.log("refreshObject dans refresh", refreshObject);
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = _generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    //console.log("refresh", error);
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};
const disconnect = async (req) => {
  const { email, token } = req.body;
  if(!email || !token) return next(Boom.badRequest('An email or a token is required to logout !'));
  let response = await RefreshToken.findOneAndDelete({
    token : token,
    userEmail : email
  });
  return response;
}

/**
 * logout user and delete token
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * 
 * @return JWT|next
 * 
 * @public
 */
exports.logout = async (req, res, next) =>{
  try {
    const response = await disconnect(req);
    //TODO rajouter emit pour logout toutes les instances du user
    return res.json(response);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
}

/**
 * logout user, delete token and emit socket disconnect
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * 
 * @return JWT|next
 * 
 * @public
 */
 exports.logoutAndRefresh = async (req, res, next) =>{
  try {
    const user = await User.findOne({email : req.body.email});
    socketIoEmit(user._id, [{name : "refreshData"}]);
    const response = await disconnect(req);
    return res.json(response);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
}
