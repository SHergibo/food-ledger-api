const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const dateMailGlobal = ['1 mois', '2 mois', '3 mois'];
const dateMailShoppingList = ['1 semaine', '2 semaines', '3 semaines'];
const warningExpirationDate = ['1 mois', '2 mois', '3 mois'];

let schema = new Schema({
  sendMailGlobal: {
    type: Boolean,
    required: true,
    default: false
  },
  dateMailGlobal: {
    type: String,
    required: true,
    default: "1 mois",
    enum : dateMailGlobal,
  },
  sendMailShoppingList: {
    type: Boolean,
    required: true,
    default: false
  },
  dateMailShoppingList: {
    type: String,
    required: true,
    default: "1 semaine",
    enum : dateMailShoppingList,
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
    type: Date,
    required: true,
    default: "1 mois",
    enum : warningExpirationDate,
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
    "userId",
  ];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Option', schema);

