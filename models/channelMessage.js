const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChannelMessageSchema = new Schema({
  from_id: {
    type: String,
    required: true,
  },
  room_id: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

module.exports = mongoose.model("ChannelMessage", ChannelMessageSchema);
