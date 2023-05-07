require('dotenv').config();
const socketIO = require('socket.io');
const Notification = require('../models/notification');

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
                
                socket.on("client-send-data", function(data) {
                    console.log(socket.id + ' says: ' + data.content + ' '  +data.id);
                    io.emit("server-send-data", data);
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

module.exports = socket