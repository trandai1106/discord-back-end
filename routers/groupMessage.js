const route = require('express').Router();
const bcrypt = require('bcrypt');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const GroupMessage = require('../models/groupMessage');

route.get('/channel/:channel_id', authMiddleware.requireLogin, async (req, res) => {
    // console.log("to_id " + req.params.to_id);
    // console.log("my_id " + req.user);
    // const messages = await GroupMessage.find();
    const messages = await GroupMessage.find({ channel_id: req.params.channel_id });
    messages.sort((m1, m2) => m1.created_at - m2.created_at);
    res.send({
        status: 1,
        message: 'Get group messages successful',
        data: {
            messages: messages
        }
    });
});

// route.get('/', authMiddleware.requireLogin, async (req, res) => {
//     // console.log("to_id " + req.params.to_id);
//     // console.log("my_id " + req.user);
//     // const messages = await GroupMessage.find();
//     const messages_received = await GroupMessage.find({ to_id: req.user._id });
//     const messages_sent = await GroupMessage.find({ from_id: req.user._id });
//     var messages = messages_received.concat(messages_sent);
//     messages.sort((m1, m2) => m1.created_at - m2.created_at);
//     res.send({
//         status: 1,
//         message: 'Get direct messages history successful',
//         data: {
//             messages: messages
//         }
//     });
// });

// route.get('/contacted', authMiddleware.requireLogin, async (req, res) => {
//     // console.log("to_id " + req.params.to_id);
//     // console.log("my_id " + req.user);
//     // const messages = await GroupMessage.find();
//     const user = await User.findById(req.user._id);

//     if (user == null) {
//         return res.send({
//             status: 0,
//             message: 'Unknown error',
//         });
//     }

//     var data = [];

//     var contactedUsers = [];
//     if (user.contacted_users) {
//         contactedUsers = user.contacted_users;
//     }

//     for (var i = 0; i < contactedUsers.length; i++) {
//         // var lastMsg = await GroupMessage.findOne({  })
        
//         const lastMessagesFromUser = await GroupMessage.findOne({ from_id: contactedUsers[i], to_id: user._id }).sort({ created_at: -1 });
//         const lastMessagesToUser = await GroupMessage.findOne({ from_id: user._id, to_id: contactedUsers[i] }).sort({ created_at: -1 });
    
//         console.log(lastMessagesFromUser.created_at);
//         console.log(lastMessagesToUser.created_at);
//         if (lastMessagesFromUser.created_at > lastMessagesToUser.created_at) {
//             data.push({
//                 user_id: contactedUsers[i],
//                 last_message: lastMessagesFromUser
//             });
//         }
//         else {
//             data.push({
//                 user_id: contactedUsers[i],
//                 last_message: lastMessagesToUser
//             });
//         }
//     }
    
//     res.send({
//         status: 1,
//         message: 'Get messages history successful',
//         data: {
//             contacted_data: data
//         }
//     });
// });

module.exports = route;