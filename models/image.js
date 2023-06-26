const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: String,
    data: String
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;