var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var Notification = new Schema({
    title: {
        type: String,
        required: true
    },
    data: Object,
    type: Number,
    status: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model('Notification', Notification);