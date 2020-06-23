const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = ['information', 'need-switch-admin','request-admin', 'last-chance-request-admin', 'request-addUser'];
const url = ['switch-admin', 'add-user-respond'];

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
    otherUserId : {
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
    },
    urlRequest : {
        type : String,
        enum : url,
        required : true
    },
    expirationDate: {
        type: Date,
    }
});

module.exports = Mongoose.model('Notification', schema);