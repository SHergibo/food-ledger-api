const User = require('./../models/user.model'),
      Bcrypt = require('bcrypt'),
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
    const checkUser = await User.findOne({email : req.body.email});

    if(!checkUser) return next(Boom.unauthorized("This email doesn't exist!"));

    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    const token = _generateTokenResponse(user, accessToken);
    return res.json({ token, user: user.transform() });
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
 * Check if user has provided a good email and password
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * 
 * @return JWT|next
 * 
 * @public
 */
 exports.checkCredential = async (req, res, next) => {
  try {
    const user = await User.findOne({email : req.body.email});
    if(!user) return next(Boom.unauthorized("This email doesn't exist!"));

    if(await Bcrypt.compare(req.body.password, user.password) === false) return next(Boom.unauthorized("Wrong password!"));
    
    return res.status(204).send();
    
  } catch (error) {
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
    const { email, refreshToken } = req.body;

    const checkUser = await User.findOne({email});
    if(!checkUser) return next(Boom.unauthorized("This email doesn't exist!"));

    const refreshObject = await RefreshToken.findOneAndDelete({
      userEmail: email,
      token: refreshToken
    });

    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = _generateTokenResponse(user, accessToken);

    return res.json(response);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

const disconnect = async (req, res, next) => {
  const { email, token } = req.body;
  if(!email || !token) return next(Boom.badRequest('An email or a token is required to logout !'));
  await RefreshToken.findOneAndDelete({
    token : token,
    userEmail : email
  });
  return;
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
    await disconnect(req, res, next);
    const user = await User.findOne({email : req.body.email});
    socketIoEmit(user._id, [{name : "logoutSameNavigator"}]);
    return res.status(204).send();
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
    await disconnect(req, res, next);
    const user = await User.findOne({email : req.body.email});
    socketIoEmit(user._id, [{name : "refreshData"}]);
    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
}
