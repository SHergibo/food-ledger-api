const JwtStrategy = require('passport-jwt').Strategy;
const User = require('./../api/models/user.model');

const { jwtSecret } = require('./environment.config');

const { ExtractJwt } = require('passport-jwt');

const jwtOptions = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer')
}

const jwt = async (payload, next) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return next(null, user);
    else return next(null, false);
  } catch (error) {
    return next(error, false);
  }
};

exports.jwt = new JwtStrategy(jwtOptions, jwt);