const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    try {
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
    }
    catch (err) {
        res.send({
            status: 0,
            message: 'Fail'
        });
    }

});

route.get('/contacts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the messages from userId or sent to userId
        const messages = await DirectMessage.find({
            $or: [{ from_id: userId }, { to_id: userId }]
        }).populate('from_id to_id');
        console.log(messages);

        // Create user list
        const contacts = [];
        messages.forEach((message) => {
            if (!contacts.includes(message.from_id)) {
                if (message.from_id !== userId) {
                    contacts.push(message.from_id);
                }
            }
            if (!contacts.includes(message.to_id)) {
                if (message.to_id !== userId) {
                    contacts.push(message.to_id);
                }
            }
        });

        res.send({
            status: 1,
            message: 'Get user history successful',
            data: {
                contacts: contacts
            }
        });
    } catch (err) {
        res.send({
            status: 0,
            message: 'Fail'
        });
    }
});


module.exports = route;