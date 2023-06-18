var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var User = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    encrypted_password: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    avatar_url: {
        type: String,
        required: true,
        default: '/avatars/default_avatar.png'
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    secret_key_reset_password: {
        type: String,
        default: ''
    },
    contacted_users: [{
        type: String,
        default: []
    }]
});
module.exports = mongoose.model('User', User);