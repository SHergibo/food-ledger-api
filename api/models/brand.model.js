const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let brand = new Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  }
}, { 
  _id : false 
});

let schema = new Schema({
  brandName: {
    type : brand,
  },
  numberOfProduct: {
    type: Number,
    required: true
  },
  numberOfHistoric: {
    type: Number,
    required: true
  },
  householdId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Household',
  },
  isBeingEdited: {
    required: true,
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

schema.methods.transform = function () {
  const fields = ['_id', 'brandName', 'numberOfProduct', "numberOfHistoric", "isBeingEdited"];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Brand', schema);

