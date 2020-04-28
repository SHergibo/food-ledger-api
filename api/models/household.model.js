const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
    member : {
        type : Array, //TODO changer en objet par la suite
        required: true
    },
    householdname : {
        type : String,
        required : true,
        trim : true
    },
    householdcode : {
        type : String,
        unique : true,
        required : true,
        trim : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
});

module.exports = Mongoose.model('Household', schema);