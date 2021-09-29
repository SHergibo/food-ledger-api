const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
  numberProduct: {
    type: Number,
    trim: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  historic: {
    type: Schema.Types.ObjectId,
    ref: 'Historic',
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
  const fields = ['_id', 'numberProduct', 'product', "historic", "householdId"];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('ShoppingList', schema);