const Mongoose = require('mongoose');
const { min } = require('moment-timezone');

let Schema = Mongoose.Schema;

const types = ['Légume', 'Viande', 'Féculent', 'Poisson', 'Fruit', 'Boisson', 'Autre'];

let expDateSchema = new Schema({
  expDate: {
    type: Date,
    required: true
  },
  productLinkedToExpDate: {
    type: Number,
    required: true,
    min: 1
  }
}, { 
  _id : false 
});

let schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: types
  },
  weight: {
    type: Number,
  },
  kcal: {
    type: String,
    trim: true
  },
  expirationDate: [expDateSchema],
  location: {
    type: String,
    trim: true
  },
  number: {
    type: Number,
    required: true,
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
  const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Product', schema);

