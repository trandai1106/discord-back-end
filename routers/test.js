const route = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

route.get('/', async (req, res) => {
    console.log('test');
    // await User.create({
    //     phone: '0941740238',
    //     name: 'Dai',
    //     encrypted_password: '$2b$10$fb.F5M82/JcQ8eScq4tfHO1MaQDx426th.mH03RC9IG3BvKC6qfLC'
    // });

    res.send("OK");
});

module.exports = route;