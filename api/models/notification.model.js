const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

const types = ['information', 'need-switch-admin', 'request-admin', 'request-delegate-admin', 'last-chance-request-delegate-admin', 'invitation-household-to-user', 'invitation-user-to-household'];
const url = ['delegate-admin', 'switch-admin-rights-respond', 'add-user-respond'];

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
    senderUserId : {
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
    },
    expirationDate: {
        type: Date,
    }
});

schema.methods.transform = function({withUserId, withHouseholdId} = {}) {
    let fields = ['_id', 'message', 'type', 'urlRequest', 'expirationDate'];

    if(withUserId){
       fields = [...fields, 'userId'];
    }

    if(withHouseholdId){
        fields = [...fields, 'householdId'];
    }

    const object = {};
    fields.forEach((field)=>{
        object[field] = this[field];
    });
    return object;
};

module.exports = Mongoose.model('Notification', schema);