const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    // console.log("to_id " + req.params.to_id);
    // console.log("my_id " + req.user);
    // const messages = await DirectMessage.find();
    const messages_from_user = await DirectMessage.find({ from_id: req.params.to_id, to_id: req.user._id });
    const messages_to_user = await DirectMessage.find({ from_id: req.user._id, to_id: req.params.to_id });
    var messages = messages_from_user.concat(messages_to_user);
    messages.sort((m1, m2) => m1.created_at - m2.created_at);
    res.send({
        status: 1,
        message: 'Get messages history successful',
        data: {
            messages: messages
        }
    });
});

module.exports = route;