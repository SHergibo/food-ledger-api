const Mongoose = require('mongoose'),
      DomPurify = require('isomorphic-dompurify');

let Schema = Mongoose.Schema;

let memberSchema = new Schema({
  userData: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isFlagged: {
    type: Boolean,
    default: false
  }
}, {
  _id: false
});

let schema = new Schema({
  members: {
    type: [memberSchema],
    required: true
  },
  householdName: {
    type: String,
    required: true,
    trim: true,
    set: function (val) {
      return DomPurify.sanitize(val);
    }
  },
  householdCode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  isWaiting: {
    type: Boolean,
    default: false,
    required: true
  },
  lastChance: {
    type: Date,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

schema.methods.transform = function () {
  const fields = ['_id', 'members', 'householdName', 'householdCode', 'isWaiting', 'userId'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Household', schema);