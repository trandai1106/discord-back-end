var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var RoomMessage = new Schema({
    from_id: {
        type: String,
        required: true
    },
    room_id: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        required: true
    }
});
module.exports = mongoose.model('RoomMessage', RoomMessage);