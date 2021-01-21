const Mongoose = require('mongoose');

let Schema = Mongoose.Schema;

let schema = new Schema({
  socketId: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'user',
  }
});

module.exports = Mongoose.model('SocketIo', schema);