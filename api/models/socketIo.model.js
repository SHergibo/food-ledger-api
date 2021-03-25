const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
  socketId: {
    type: Array,
    required: true,
  },
  userId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'user',
  }
});

module.exports = Mongoose.model('SocketIo', schema);