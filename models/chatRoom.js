var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ChatRoom = new Schema({
  roomName: String,
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  pendingParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  approvedParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rejectedParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});
module.exports = mongoose.model('ChatRoom', ChatRoom);
