const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    var messages = await DirectMessage.find({ from_id: req.user._id, to_id: req.params.to_id });
    console.log('messages ' + messages);
    res.send(messages);
});

module.exports = route;