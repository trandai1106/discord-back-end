const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');

route.get("/all", async (req, res) => {
    try {
        const users = await User.find({});
        res.send({
            status: 1,
            users: users,
            message: "Success"
        })
    } catch (err) {
        res.send({
            status: 0,
            message: 'Fail'
        });
    }
})

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.params.to_id);
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
    }
    catch (err) {
        res.send({
            status: 0,
            message: 'Fail'
        });
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