const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');
const RoomMessage = require('../models/roomMessage');

route.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
    var user = await User.findById(req.params.to_id);
    if (user) {
        res.send({
            status: 1,
            message: 'Get user information successful',
            data: {
                user: {
                    email: user.email,
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

// Get all users
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
});

// Update user information
route.put('/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({
                status: 0,
                message: 'User not found',
            });
        }
        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();
        res.send({
            status: 1,
            message: 'User information updated successfully',
            data: {
                user: {
                    email: user.email,
                    name: user.name,
                    id: user._id,
                    avatar: user.avatar_url,
                },
            },
        });
    }
    catch (err) {
        res.send({
            status: 0,
            message: 'Error updating user information',
        });
    }
});


// Upload user avatar

// Delete user by id
route.delete('/:id', (req, res) => {
    User.findByIdAndDelete(req.params.id).then(users => {
        DirectMessage.deleteMany({
            $or: [
                { from_id: req.params.id },
                { to_id: req.params.id }
            ]
        }).then(() => {
            RoomMessage.deleteMany({
                from_id: req.params.id
            }).then(() => {
                res.send({
                    status: 1,
                    message: 'Delete user successful',
                    data: {
                        users
                    }
                });
            }).catch(error => {
                console.log(error);
            });
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });
});

module.exports = route;