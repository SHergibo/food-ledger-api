const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  numberOfProduct: {
    type: Number,
    required: true
  },
  householdId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Household',
  }
}, {
  timestamps: true
});

schema.methods.transform = function () {
  const fields = ['_id', 'brandName', 'numberOfProduct'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Brand', schema);

