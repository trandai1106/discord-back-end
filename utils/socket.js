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

                // Link user's socket ID with user id
                socket.on("c_pairID", async function (data) {
                    console.log("User connect - ID: " + data.id + " - SocketID: " + socket.id);

                    // Authenticate token
                    var user = await authenticate(data.access_token);
                    if (user) {
                        // Check if exist id that pair before
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

                // Listen of chat event from client
                socket.on("c_directMessage", async function (data) {
                    console.log(data);
                    // Authenticate token
                    var user = await authenticate(data.access_token);
                    if (user) {
                        // Check if receiver's id is exist
                        var receiver = await User.findById(data.to_id);
                        if (receiver != null) {
                            var newMessage = await DirectMessage.create({
                                from_id: user._id,
                                to_id: data.to_id,
                                message: data.content
                            })
                        }
                        else {
                            console.log("Cannot find receiver");
                            return;
                        }

                        // Find all socket IDs of receiver 
                        var pair = pairIDs.find(pair => pair.id == data.to_id);

                        // If there is no socket ID exists, it means they are offline
                        if (pair == null) {
                            console.log("Receiver is not online");
                        }
                        else { // If they are online, emit event to them via all socket IDs
                            pair.socketIDs.forEach(socketID => {
                                io.to(socketID).emit("s_directMessage", {
                                    from_id: data.from_id,
                                    to_id: data.to_id,
                                    content: data.content,
                                    time: newMessage.created_at
                                });
                            });
                        }

                    }
                    else {
                        console.log("Cannot authenticate");
                        return;
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
    console.log(decodedToken.status);
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