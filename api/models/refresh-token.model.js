const Mongoose = require('mongoose'),
  Crypto = require('crypto'),
  Moment = require('moment-timezone');

const schema = new Mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    ref: 'User',
    required: true,
  },
  expires: {
    type: Date,
  }
});

schema.statics.generate = function (user) {
  const tokenObject = new RefreshToken();
  tokenObject.token = `${user._id}.${Crypto.randomBytes(40).toString('hex')}`;
  tokenObject.userId = user._id;
  tokenObject.userEmail = user.email;
  tokenObject.expires = Moment().add(30, "days").toDate();
  tokenObject.save();
  return tokenObject;
}

const RefreshToken = Mongoose.model('RefreshToken', schema);

module.exports = RefreshToken;