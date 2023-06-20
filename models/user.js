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
        default: getRandomDefaultAvatarUrl
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    secret_key_reset_password: {
        type: String,
        default: ''
    },
    contacted_users: [{
        type: String,
        default: []
    }],
    contacted_rooms: [{
        type: String,
        default: []
    }]
});

function getRandomDefaultAvatarUrl() {
    const arr = [
        "/avatars/default_avatar_black.jpg",
        "/avatars/default_avatar_blue.png",
        "/avatars/default_avatar_gray.png",
        "/avatars/default_avatar_green.jpg",
        "/avatars/default_avatar_pink.jpg",
        "/avatars/default_avatar_purple.jpg",
        "/avatars/default_avatar_red.png",
        "/avatars/default_avatar_violet.jpg",
        // "/avatars/default_avatar.png",
    ];

    return arr[getRandomInt(0, arr.length)];
};
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

module.exports = mongoose.model('User', User);