const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
    member : {
        type : Array,
        required: true
    },
    householdName : {
        type : String,
        required : true,
        trim : true
    },
    householdCode : {
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

schema.methods.transform = function() {
    const fields = ['_id', 'member', 'householdName', 'householdCode', 'isWaiting', 'userId'];
    const object = {};
    fields.forEach((field)=>{
        object[field] = this[field];
    });
    return object;
};

module.exports = Mongoose.model('Household', schema);