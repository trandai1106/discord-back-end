require('dotenv').config();
const socketIO = require('socket.io');
const Notification = require('../models/notification');
const User = require('../models/user');
const { verifyAccessToken } = require('../utils/security');

const socket = (() => {
    var io;
    var users = [];
    return {
        init: function (server) {
            io = socketIO(server, {
                cors: {
                    origin: '*'
                }
            });

            io.sockets.on('connection', function (socket) {
                console.log("User connect - ID: " + socket.id);
                if (!users.includes(socket.id)) {
                    users.push(socket.id);
                    console.log(users.length + " users: " + " - " + users);
                }

                socket.emit('set-socket-id', socket.id);
                
                socket.on("client-send-data", async function(data) {

                    var user = await authenticate(data.access_token);
                    if (user) {
                        console.log('user: ' + user.name + ", socket id: " + socket.id + ', content: ' + data.content);
                        io.emit("server-send-data", {
                            sender_id: user._id,
                            content: data.content,
                            socket_id: socket.id
                        });
                    }
                    else {
                        console.log("Cannot authenticate");
                    }
                });

                socket.on("disconnect", async () => {
                    console.log("User disconnect - ID: " + socket.id);
                    const index = users.findIndex(id => id == socket.id);
                    if (index != -1) {
                        users.splice(index, 1);
                        console.log(users.length + " users: " + " - " + users);
                    }
                });
            });
        },
        emitSocket: function (event, data, to) {
            if (to) {
                io.sockets.to(to).emit(event, data);
            } else {
                io.sockets.emit(event, data);
            }
        },
        getSaleSocket: function () {
            return users;
        },
        getInstance: function () {
            return io;
        }
    }
})();

const authenticate = async (token) => {
    var decodedToken = verifyAccessToken(token);

    if (decodedToken.status == 403) {
        return null;
    }
    else if (decodedToken.status == 200) {
        const userExist = await User.exists({ name: decodedToken.data.name });
        if (userExist) {
            const user = await User.findOne({ name: decodedToken.data.name });
            return user;
        } else {
            return null;
        }
    }
};

module.exports = socket