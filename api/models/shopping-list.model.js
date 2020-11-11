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

module.exports = Mongoose.model('ShoppingList', schema);