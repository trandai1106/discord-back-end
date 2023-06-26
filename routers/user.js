const router = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');
const Image = require('../models/image');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const users = await User.find({ name: new RegExp(query, "i") }).select('email name id avatar_url');
        res.send({
            status: 1,
            message: 'Search users successful',
            data: {
                users
            }
        });
    } catch (err) {
        res.send({
            status: 0,
            message: 'Error searching users',
        });
    }
});

router.get('/:to_id', authMiddleware.requireLogin, async (req, res) => {
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
router.get('/', (req, res) => {
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
router.put('/:id', async (req, res) => {
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
            message: 'Error while updating user information',
        });
    }
});


// Upload user avatar
router.post('/avatar/:id', upload.single("file"), async (req, res) => {
    try {
        const userId = req.params.id;

        if (!req.file) {
            return res.status(400).send({
                status: 0,
                message: 'There was an error while uploading the file'
            });
        }

        const imageData = req.file.buffer.toString('base64');
        const existingImage = await Image.findOne({ name: userId });

        if (existingImage) {
            existingImage.data = imageData;
            await existingImage.save();
        } else {
            console.log('new image');
            const user = await User.findByIdAndUpdate(userId, {
                avatar_url: "/users/images/" + userId
            })
            const newImage = new Image({
                name: userId,
                data: imageData
            });
            await newImage.save();
        }

        res.send({
            status: 1,
            message: 'Image uploaded successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            status: 0,
            message: 'Error while uploading image'
        });
    }
});

// Get all the images
router.get('/images/all', async (req, res) => {
    const image = await Image.find();
    res.send({
        status: 1,
        data: image
    })
})

// Get image from database
router.get('/images/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const image = await Image.findOne({ name: id });

        if (!image) {
            return res.status(404).send({
                status: 0,
                message: 'Image not found'
            });
        }

        const imageData = Buffer.from(image.data, 'base64');
        res.set('Content-Type', 'image/jpeg');
        res.send(imageData);
    } catch (error) {
        console.error(error)
        res.status(500).send({
            status: 0,
            message: 'Get image fail'
        });
    }
});

router.delete('/images/:id', async (req, res) => {
    Image.findOneAndDelete({ name: req.params.id })
        .then(data => res.send("delete successfuly"))
        .catch(error => res.status(500).send("Error deleting image"))
});

// Delete user by id
router.delete('/:id', (req, res) => {
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

module.exports = router;