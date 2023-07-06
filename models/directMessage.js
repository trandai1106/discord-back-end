const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DirectMessageSchema = new Schema({
  from_id: {
    type: String,
    required: true,
  },
  to_id: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

module.exports = mongoose.model("DirectMessage", DirectMessageSchema);
