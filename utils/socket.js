require('dotenv').config();
const socketIO = require('socket.io');
const Notification = require('../models/notification');
const User = require('../models/user');
const DirectMessage = require('../models/directMessage');
const { verifyAccessToken } = require('../utils/security');

const socket = (() => {
    var io;
    var pairIDs = [];
    return {
        init: function (server) {
            io = socketIO(server, {
                cors: {
                    origin: '*'
                }
            });

            io.sockets.on('connection', function (socket) {
                socket.on("c_pairID", async function (data) {
                    console.log("User connect - ID: " + data.id + " - SocketID: " + socket.id);

                    var user = await authenticate(data.access_token);

                    if (user) {
                        var usePairID = pairIDs.find(pair => pair.id == data.id);
                        if (usePairID == null) {
                            pairIDs.push({ id: data.id, socketIDs: [socket.id] });
                        }
                        else {
                            usePairID.socketIDs.push(socket.id);
                        }
                        
                        console.log("-------------New update-------------");
                        console.log(pairIDs);
                    }
                    else {
                        console.log("Cannot authenticate");
                    }
                });

                socket.on("client-send-data", async function (data) {

                    var user = await authenticate(data.access_token);
                    if (user) {
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
                    console.log("User disconnect - SocketID: " + socket.id);

                    var usePairID = pairIDs.find(pair => pair.socketIDs.includes(socket.id));
                    if (usePairID == null) {
                        console.log("Error: Cannot find socket ID");
                    }
                    else {
                        var index = usePairID.socketIDs.indexOf(socket.id);
                        if (index > -1) { // only splice array when item is found
                            usePairID.socketIDs.splice(index, 1); // 2nd parameter means remove one item only
                        }
                        if (usePairID.socketIDs.length == 0) {
                            index = pairIDs.indexOf(usePairID);
                            if (index > -1) { // only splice array when item is found
                                pairIDs.splice(index, 1); // 2nd parameter means remove one item only
                            }
                        }
                    }
                    console.log("-------------New update-------------");
                    console.log(pairIDs);
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