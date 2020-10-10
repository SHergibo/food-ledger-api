const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const typeInfo = ['Mise à jour', 'Ajout', 'Suppression'];

let schema = new Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productBrand: {
    type: String,
    required: true,
    trim: true,
  },
  productWeight: {
    type: String,
    required: true,
    trim: true,
  },
  infoProduct: {
    type: String,
    required: true,
    enum: typeInfo
  },
  numberProduct: {
    type: String,
    trim: true,
  },
  householdId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Household',
  },
  user: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

schema.methods.transform = function () {
  const fields = ['_id', 'productName', 'productBrand', 'productWeight', 'infoProduct', 'numberProduct', 'user', 'createdAt'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('ProductLog', schema);