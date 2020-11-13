const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const dateMailGlobal = ['Tout les mois', 'Tout les deux mois', 'Tout les trois mois'];
const dateMailShoppingList = ['Toutes les semaines', 'Toutes les deux semaines', 'Toutes les trois semaines', 'Tous les mois'];
const warningExpirationDate = ["Un mois à l'avance", "Deux mois à l'avance", "Trois mois à l'avance"];

let objectDateMailGlobal = new Schema({
  value: {
    type: Number,
    required: true,
    default: 0
  },
  label: {
    type: String,
    required: true,
    default : "Tout les mois",
    enum: dateMailGlobal
  }
}, { 
  _id : false 
});

let objectDateMailShoppingList = new Schema({
  value: {
    type: Number,
    required: true,
    default: 0
  },
  label: {
    type: String,
    required: true,
    default : "Toutes les semaines",
    enum: dateMailShoppingList
  }
}, { 
  _id : false 
});

let objectWarningExpirationDate = new Schema({
  value: {
    type: Number,
    required: true,
    default: 0
  },
  label: {
    type: String,
    required: true,
    default : "Un mois à l'avance",
    enum: warningExpirationDate
  }
}, { 
  _id : false 
});

let schema = new Schema({
  sendMailGlobal: {
    type: Boolean,
    required: true,
    default: false
  },
  dateMailGlobal: {
    type : objectDateMailGlobal,
    default: () => ({}),
  },
  sendMailShoppingList: {
    type: Boolean,
    required: true,
    default: false
  },
  dateMailShoppingList: {
    type : objectDateMailShoppingList,
    default: () => ({}),
  },
  minimalProductStockGlobal: {
    type: Number,
    min: 0,
    default: 0
  },
  updateAllMinimalProductStock: {
    type: Boolean,
    default: false
  },
  warningExpirationDate: {
    type : objectWarningExpirationDate,
    default: () => ({}),
  },
  colorCodeDate: {
    type: Boolean,
    required: true,
    default: true
  },
  colorCodeStock: {
    type: Boolean,
    required: true,
    default: true
  },
  openMenu: {
    type: Boolean,
    required: true,
    default: false,
  },
  userId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
});

schema.methods.transform = function () {
  const fields = [
    '_id', 
    'sendMailGlobal', 
    'dateMailGlobal', 
    "sendMailShoppingList", 
    "dateMailShoppingList", 
    "minimalProductStockGlobal", 
    "updateAllMinimalProductStock", 
    "warningExpirationDate",
    "colorCodeDate",
    "colorCodeStock",
    "openMenu",
    "userId",
  ];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Option', schema);

