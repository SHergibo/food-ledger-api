const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = ['Légume', 'Viande', 'Féculent', 'Poisson', 'Fruit', 'Boisson', 'Autre'];

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
  expirationDate: {
    type: Array,
    required: true
  },
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

