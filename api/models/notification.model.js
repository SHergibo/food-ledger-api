const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = ['information', 'request-admin', 'request-addUser'];

let schema = new Schema({
    message : {
        type : String,
        required: true,
        trim : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
    },
    householdId : {
        type : Schema.Types.ObjectId,
        ref : 'Household',
    },
    type : {
        type : String,
        enum : types,
        required : true
    }
});

module.exports = Mongoose.model('Notification', schema);