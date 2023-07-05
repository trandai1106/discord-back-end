require("dotenv").config();
const socketIO = require("socket.io");
const User = require("../models/user");
const DirectMessage = require("../models/directMessage");
const ChannelMessage = require("../models/channelMessage");
const Channel = require("../models/channel");
const { verifyAccessToken } = require("../utils/security");

const socket = (() => {
  var io;
  var pairIDs = [];
  return {
    init: function (server) {
      io = socketIO(server, {
        cors: {
          origin: "*",
        },
      });

      io.sockets.on("connection", function (socket) {
        // Link user's socket ID with user id
        socket.on("c_pairID", async function (data) {
          console.log(
            "User connect - ID: " + data.id + " - SocketID: " + socket.id
          );

          // Authenticate token
          var user = await authenticate(data.access_token);
          if (user) {
            // Check if exist id that pair before
            var usePairID = pairIDs.find((pair) => pair.id == data.id);
            if (usePairID == null) {
              pairIDs.push({ id: data.id, socketIDs: [socket.id] });
            } else {
              usePairID.socketIDs.push(socket.id);
            }

            io.emit(
              "updateUserOnlineList",
              pairIDs.map((pairID) => pairID.id)
            );

            console.log(
              "-------------New update-------------",
              new Date().toLocaleTimeString()
            );
            console.log(pairIDs);
          } else {
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
                message: data.content,
              });
              if (user.contacted_users) {
                if (!user.contacted_users.includes(data.to_id)) {
                  user.contacted_users.push(data.to_id);
                  await User.findOneAndUpdate(
                    { _id: user._id },
                    { contacted_users: user.contacted_users }
                  );
                }
              }
              if (receiver.contacted_users) {
                if (!receiver.contacted_users.includes(user._id)) {
                  receiver.contacted_users.push(user._id);
                  await User.findOneAndUpdate(
                    { _id: receiver._id },
                    { contacted_users: receiver.contacted_users }
                  );
                }
              }
            } else {
              console.log("Cannot find receiver");
              return;
            }

            // Find all socket IDs of receiver and sender
            var receiverPair = pairIDs.find((pair) => pair.id == data.to_id);

            // If there is no socket ID exists, it means they are offline
            if (receiverPair == null) {
              console.log("Receiver is not online");
            } else {
              // If they are online, emit event to them via all socket IDs
              receiverPair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("s_directMessage", {
                  from_id: data.from_id,
                  to_id: data.to_id,
                  content: data.content,
                  created_at: newMessage.created_at,
                });
              });
            }

            // Find all socket IDs of receiver and sender
            var senderPair = pairIDs.find((pair) => pair.id == user._id);
            // If there is no socket ID exists, it means they are offline
            if (senderPair == null) {
              console.log("Sender is not online");
            } else {
              // If they are online, emit event to them via all socket IDs
              senderPair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("s_directMessage", {
                  from_id: data.from_id,
                  to_id: data.to_id,
                  content: data.content,
                  created_at: newMessage.created_at,
                });
              });
            }
          } else {
            console.log("Cannot authenticate");
            return;
          }
        });

        socket.on("c_ChannelMessage", async function (data) {
          console.log(data);
          // Authenticate token
          var user = await authenticate(data.access_token);
          if (user) {
            // Check if receiver's id is exist
            var room = await Channel.findById(data.room_id);
            if (room != null) {
              var newMessage = await ChannelMessage.create({
                from_id: user._id,
                room_id: data.room_id,
                message: data.content,
              });
              if (user.contacted_rooms) {
                if (!user.contacted_rooms.includes(data.room_id)) {
                  user.contacted_rooms.push(data.room_id);
                  await User.findOneAndUpdate(
                    { _id: user._id },
                    { contacted_rooms: user.contacted_rooms }
                  );
                }
              }
            } else {
              console.log("Cannot find room");
              return;
            }

            // Find all socket ID of users
            pairIDs.forEach((pair) => {
              pair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("s_ChannelMessage", {
                  from_id: data.from_id,
                  room_id: data.room_id,
                  content: data.content,
                  created_at: newMessage.created_at,
                });
              });
            });
          } else {
            console.log("Cannot authenticate");
            return;
          }
        });

        socket.on("deleteDirectMessage", (data) => {
          try {
            const receiverPair = pairIDs.find((pair) => pair.id == data.to_id);
            if (receiverPair == null) {
              console.log("Receiver is not online");
            } else {
              receiverPair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("deleteDirectMessage", data);
              });
            }
          } catch {}
        });

        socket.on("deleteChannelMessage", (data) => {
          try {
            // Find all socket ID of users
            if (pairIDs === null) {
              return;
            }
            pairIDs.forEach((pair) => {
              pair.socketIDs.forEach((socketID) => {
                if (pair.id !== data.from_id) {
                  io.to(socketID).emit("deleteChannelMessage", data);
                }
              });
            });
          } catch {}
        });

        socket.on("directCall", (data) => {
          try {
            const receiverPair = pairIDs.find((pair) => pair.id == data.to_id);
            if (receiverPair == null) {
              console.log("Receiver is not online");
            } else {
              receiverPair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("directCall", data);
              });
            }
          } catch {
            // const fromSocketId = pairIDs.filter(pairID => pairID.id === from_id)[0].socketIDs[0];
            // socket.to(fromSocketId).emit("offiline", data);
          }
        });

        socket.on("roomCall", (data) => {
          try {
            pairIDs.forEach((pair) => {
              io.to(pair.socketIDs).emit("roomCall", data);
            });
          } catch {}
        });

        socket.on("rejectCall", (data) => {
          try {
            const receiverPair = pairIDs.find((pair) => pair.id == data.to_id);
            if (receiverPair == null) {
              console.log("Receiver is not online");
            } else {
              receiverPair.socketIDs.forEach((socketID) => {
                io.to(socketID).emit("rejectedCall", data);
              });
            }
          } catch {
            // const fromSocketId = pairIDs.filter(pairID => pairID.id === from_id)[0].socketIDs[0];
            // socket.to(fromSocketId).emit("offiline", data);
          }
        });

        socket.on("newCall", (id, room) => {
          socket.join(room);
          socket.to(room).emit("newuserJoinedCall", id);
          socket.on("disconnect", () => {
            socket.to(room).emit("userLeaveCall", id);
          });
        });

        // socket.on('join-room', (roomId, userId) => {
        //     socket.join(roomId)
        //     io.to(roomId).broadcast.emit('user-connected', userId)

        //     socket.on('disconnect', () => {
        //         io.to(roomId).broadcast.emit('user-disconnected', userId)
        //     })
        // });

        socket.on("checkOnlineUserList", (userId) => {
          const receiverPair = pairIDs.find((pair) => pair.id == userId);
          if (receiverPair) {
            receiverPair.socketIDs.forEach((socketID) => {
              io.to(socketID).emit(
                "updateUserOnlineList",
                pairIDs.map((pairID) => pairID.id)
              );
            });
          }
        });

        socket.on("disconnect", async () => {
          console.log(
            "User disconnect - SocketID: " + socket.id,
            new Date().toLocaleTimeString()
          );

          var usePairID = pairIDs.find((pair) =>
            pair.socketIDs.includes(socket.id)
          );
          if (usePairID == null) {
            console.log("Error: Cannot find socket ID");
          } else {
            var index = usePairID.socketIDs.indexOf(socket.id);
            if (index > -1) {
              // only splice array when item is found
              usePairID.socketIDs.splice(index, 1); // 2nd parameter means remove one item only
            }
            if (usePairID.socketIDs.length == 0) {
              index = pairIDs.indexOf(usePairID);
              if (index > -1) {
                // only splice array when item is found
                pairIDs.splice(index, 1); // 2nd parameter means remove one item only
              }
            }
          }

          io.emit(
            "updateUserOnlineList",
            pairIDs.map((pairID) => pairID.id)
          );

          console.log(
            "-------------New update-------------",
            new Date().toLocaleTimeString()
          );
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
    },
  };
})();

const authenticate = async (token) => {
  var decodedToken = verifyAccessToken(token);
  console.log(decodedToken.status);
  if (decodedToken.status == 403) {
    return null;
  } else if (decodedToken.status == 200) {
    const userExist = await User.exists({ name: decodedToken.data.name });
    if (userExist) {
      const user = await User.findOne({ name: decodedToken.data.name });
      return user;
    } else {
      return null;
    }
  }
};

module.exports = socket;
