var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var GroupMessage = new Schema({
    from_id: {
        type: String,
        required: true
    },
    group_id: {
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
module.exports = mongoose.model('GroupMessage', GroupMessage);