const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    var user = await User.findById(req.params.to_id);
    if (user) {
        res.send({
            status: 1,
            message: 'Get user information successful',
            data: {
                user: {
                    name: user.name,
                    id: user._id,
                    avatar: user.avatar_url
                }
            }
        })
    }
    else {

    }
});

route.get('/', (req, res) => {
    User.find({}).then(users => {
        res.send({
            status: 1,
            message: 'Get users successful',
            data: {
                users
            }
        })
    }).catch(error => {
        console.log(error);
    })
})

module.exports = route;