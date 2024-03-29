const Mongoose = require('mongoose'),
      DomPurify = require('isomorphic-dompurify');

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
    trim: true,
    set: function (val) {
      return DomPurify.sanitize(val);
    }
  },
  slugName: {
    type: String,
    required: true,
    trim: true,
    set: function (val) {
      return DomPurify.sanitize(val);
    }
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
  expirationDate: [expDateSchema],
  location: {
    type: String,
    trim: true,
    set: function (val) {
      return DomPurify.sanitize(val);
    }
  },
  slugLocation: {
    type: String,
    trim: true,
    set: function (val) {
      return DomPurify.sanitize(val);
    }
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
  const fields = ['_id', 'name', 'brand', 'type', 'weight', 'kcal', 'expirationDate', 'location', 'number', 'minimumInStock', 'isBeingEdited'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Product', schema);

