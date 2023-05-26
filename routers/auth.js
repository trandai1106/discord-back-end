const route = require('express').Router();
const bcrypt = require('bcrypt');
const dataValidation = require('../utils/dataValidation');
const security = require('../utils/security');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

route.post('/login', async (req, res) => {
    const { name, password } = req.body;
    console.log('login request ' + name + " - " + password);
  
    const user = await User.findOne({ name: name });
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
  const { name, password } = req.body;
    console.log('register request ' + name + " - " + password);
    if (!dataValidation.isArrayHasBlankOrNullElement([name, password])) {
      const isExist = await User.exists({ name: name });
      if (isExist) {
        return res.send({
          status: 0,
          message: 'User name is exist'
        })
      }
      
      const encrypted_password = await security.encryptPassword(password);
      const user = await User.create({ name, encrypted_password });
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