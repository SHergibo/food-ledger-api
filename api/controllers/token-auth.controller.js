const TokenAuth = require('../models/token-auth.model'),
  Boom = require('@hapi/boom'),
  User = require('./../models/user.model'),
  Moment = require('moment-timezone')

/** 
* POST token 
*/
exports.createNewToken = async (req, res, next) => {
  try {
    let expiredToken = await TokenAuth.findOne({ token: req.params.tokenId });
    let user = await User.findById(expiredToken.userId);
    await TokenAuth.findByIdAndDelete(expiredToken.id);
    TokenAuth.generate(user);
    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
}

/** 
* PATCH token 
*/
exports.updateUsedToken = async (req, res, next) => {
  try {
    let findTokenAuth = await TokenAuth.findOne({ token: req.params.tokenId });
    console.log(findTokenAuth)
    if (findTokenAuth.expires < Moment().toDate()) {
      return res.status(401).send({ error: 'Verification token expired' });
    } else {
      let token = await TokenAuth.findOneAndUpdate({ token: req.params.tokenId }, { used: true }, { new: true });
      let user = await User.findByIdAndUpdate(token.userId, { role: "user" });
      return res.json(user.transform());
    }
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
}