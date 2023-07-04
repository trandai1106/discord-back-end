var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ChatRoom = new Schema({
  name: {
    type: String,
    required: true,
  },
  // messages: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'RoomMessage'
  // }],
  // pendingParticipants: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "User",
  //   },
  // ],
  // approvedParticipants: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "User",
  //   },
  // ],
  // rejectedParticipants: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "User",
  //   },
  // ],
  // invitedUsers: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "User",
  //   },
  // ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("ChatRoom", ChatRoom);
