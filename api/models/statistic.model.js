const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let statisticObject = new Schema({
  chartOne: {
    type: Object,
  },
  chartTwo: {
    type: Array,
  },
  chartThree: {
    type: Array,
  },
  chartFour: {
    type: Object,
  }
}, { 
  _id : false 
});

let schema = new Schema({
  statistics: {
    type : statisticObject,
    trim: true,
    required: true
  },
  isOutdated: {
    type: Boolean,
    required: true,
    default: false,
  },
  householdId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Household',
  }
});

schema.methods.transform = function () {
  const fields = ['statistics'];
  const object = {};
  fields.forEach((field) => {
    object[field] = this[field];
  });
  return object;
};

module.exports = Mongoose.model('Statistics', schema);