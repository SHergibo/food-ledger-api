const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = ['Légume', 'Viande', 'Poisson', 'Fruit', 'Boisson', 'Produit sucré', "Produit laitier", "Farineux", "Céréale", "Légumineuse"];

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

let minimumInStock = new Schema({
  minInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  updatedBy: {
    type: String,
    required: true,
    default: 'globalOption'
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
  slugName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Brand',
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
  minimumInStock : {
    type : minimumInStock,
    default: () => ({}),
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
  const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number', 'minimumInStock'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Product', schema);

