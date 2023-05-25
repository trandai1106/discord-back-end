var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var DirectMessage = new Schema({
    from_id: {
        type: String,
        required: true
    },
    to_id: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});
module.exports = mongoose.model('DirectMessage', DirectMessage);