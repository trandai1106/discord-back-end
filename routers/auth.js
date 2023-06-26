const route = require('express').Router();
const bcrypt = require('bcrypt');
const dataValidation = require('../utils/dataValidation');
const security = require('../utils/security');
const User = require('../models/user');
const ChatRoom = require('../models/chatRoom');
const authMiddleware = require('../middleware/auth');

route.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('login request ' + email + " - " + password);

  const user = await User.findOne({ email: email });
  // console.log(await User.findOne());
  console.log("user " + user);
  if (user) {
    const checkPassword = await security.verifyPassword(password, user.encrypted_password);
    if (checkPassword) {
      const newAT = security.generateAccessToken(user);
      const newRT = security.generateRefreshToken(user);
      console.log("right password");
      return res.send({
        status: 1,
        message: 'OK',
        data: {
          access_token: newAT,
          refresh_token: newRT,
          id: user._id
        }
      });
    }
    else {
      console.log("incorrect password");
      return res.send({
        status: 0,
        message: 'Password is incorrect'
      });
    }
  }
  else {
    return res.send({
      status: 0,
      message: 'User is not exist'
    })
  }


});
route.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('register request ' + email + " - " + password);
  if (!dataValidation.isArrayHasBlankOrNullElement([name, email, password])) {
    const isExistEmail = await User.exists({ email: email });
    const isExistName = await User.exists({ name: name });
    if (isExistEmail) {
      return res.send({
        status: 0,
        message: 'This email already in use'
      })
    }
    if (isExistName) {
      return res.send({
        status: 0,
        message: 'This name already in use'
      })
    }

    const encrypted_password = await security.encryptPassword(password);
    const user = await User.create({ name, email, encrypted_password });

    const generalRoom = await ChatRoom.findOne({ name: 'General' });
    if (generalRoom) generalRoom.approvedParticipants.push(user._id);
    await ChatRoom.findOneAndUpdate({name: 'General'}, { approvedParticipants: generalRoom.approvedParticipants });

    const notificationRoom = await ChatRoom.findOne({ name: 'Notification' });
    if (notificationRoom) notificationRoom.approvedParticipants.push(user._id);
    await ChatRoom.findOneAndUpdate({ name: 'Notification'}, { approvedParticipants: notificationRoom.approvedParticipants });

    const newAT = security.generateAccessToken(user);
    const newRT = security.generateRefreshToken(user);
    return res.send({
      status: 1,
      message: 'OK',
      data: {
        access_token: newAT,
        refresh_token: newRT,
        id: user._id
      }
    })
  }
  else {
    return res.send({
      status: 0,
      message: 'Fail'
    })
  }
});
route.get('/profile', authMiddleware.requireLogin, async (req, res) => {
  if (req.user) {
    res.send({
      status: 1,
      message: 'Get user information successful',
      data: {
        user: {
          email: req.user.email,
          name: req.user.name,
          id: req.user._id,
          avatar: req.user.avatar_url
        }
      }
    })
  }
  else {
    res.send({
      status: 0,
      message: 'Error'
    })
  }
});

module.exports = route;