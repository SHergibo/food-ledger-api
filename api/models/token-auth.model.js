const Mongoose = require('mongoose'),
      Crypto = require('crypto'),
      Moment = require('moment-timezone')

let Schema = Mongoose.Schema;

let schema = new Schema({
    token : {
        type : String,
        required : true,
        index : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    userEmail : {
        type : String,
        ref : 'User',
        required : true,
    },
    used : {
        type : Boolean,
    },
    expires: {
        type: Date,
    }
});

schema.statics.generate = function(user) {
    console.log(user)
    const tokenObject = new tokenAuth();
    tokenObject.token = `${user._id}.${Crypto.randomBytes(40).toString('hex')}`;
    tokenObject.userId = user._id;
    tokenObject.userEmail = user.email;
    tokenObject.used = false;
    tokenObject.expires = Moment().add(5, "minutes").toDate();
    tokenObject.save();
};

const tokenAuth = Mongoose.model('TokenAuth', schema);

module.exports = tokenAuth;