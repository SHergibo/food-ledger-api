const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = [
  {label: 'Légume', value: 'legume'}, 
  {label: 'Viande', value: 'viande'}, 
  {label: 'Poisson', value: 'poisson'}, 
  {label: 'Fruit', value: 'fruit'}, 
  {label: 'Boisson', value: 'boisson'}, 
  {label: 'Produit sucré', value: 'produit-sucre'}, 
  {label: "Produit laitier", value: 'produit-laitier'}, 
  {label: 'Farineux', value: 'farineux'}, 
  {label: 'Céréale', value: 'cereale'}, 
  {label: 'Légumineuse', value: 'legumineuse'}
];


let expDateSchemaHistoric = new Schema({
  expDate: {
    type: Date
  },
  productLinkedToExpDate: {
    type: Number
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
    type: Object,
    enum: types
  },
  weight: {
    type: Number,
  },
  kcal: {
    type: Number,
  },
  expirationDate: [expDateSchemaHistoric],
  location: {
    type: String,
    trim: true
  },
  slugLocation: {
    type: String,
    required: true,
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

module.exports = Mongoose.model('Historic', schema);

