const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
    member : {
        type : Array,
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
    isWaiting : {
        type : Boolean,
        default : false,
        required : true
    },
    lastChance : {
        type : Date,
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
});

module.exports = Mongoose.model('Household', schema);