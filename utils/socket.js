require("dotenv").config();
const socketIO = require("socket.io");
const User = require("../models/user");
const DirectMessage = require("../models/directMessage");
const ChannelMessage = require("../models/channelMessage");
const Channel = require("../models/channel");
const { verifyAccessToken } = require("../utils/security");

const socket = (() => {
  let io;
  const pairIDs = [];
  return {
    init: function (server) {
      io = socketIO(server, {
        cors: {
          origin: "*",
        },
      });

      io.sockets.on("connection", (socket) => {
        // Link user's socket ID with user id
        socket.on("c_pairID", async (data) => {
          console.log(
            "User connect - ID: " + data.id + " - SocketID: " + socket.id
          );

          // Authenticate token
          const user = await authenticate(data.access_token);
          if (user) {
            // Check if exist id that pair before
            const usePairID = pairIDs.find((pair) => pair.id == data.id);
            if (usePairID == null) {
              pairIDs.push({ id: data.id, socketIDs: [socket.id] });
            } else {
              usePairID.socketIDs.push(socket.id);
            }

            io.emit(
              "update_online_user",
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
        socket.on("c_directMessage", async (data) => {
          // Check if receiver's id is exist
          const sender = await User.findById(data.from_id);
          const receiver = await User.findById(data.to_id);
          if (receiver != null) {
            if (sender.contacted_users) {
              if (!sender.contacted_users.includes(data.to_id)) {
                sender.contacted_users.push(data.to_id);
                await User.findOneAndUpdate(
                  { _id: sender._id },
                  { contacted_users: sender.contacted_users }
                );
              }
            }
            if (receiver.contacted_users) {
              if (!receiver.contacted_users.includes(data.from_id)) {
                receiver.contacted_users.push(data.from_id);
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

          const newMessage = await DirectMessage.create({
            from_id: data.from_id,
            to_id: data.to_id,
            content: data.content,
          });

          pairIDs.forEach((pair) => {
            pair.socketIDs.forEach((socketID) => {
              if (pair.id === data.to_id || pair.id === data.from_id) {
                io.to(socketID).emit("s_directMessage", newMessage);
              }
            });
          });
        });

        socket.on("c_ChannelMessage", async (data) => {
          const newMessage = await ChannelMessage.create({
            from_id: data.from_id,
            channel_id: data.channel_id,
            content: data.content,
          });

          const channel = await Channel.findById(data.channel_id);

          pairIDs.forEach((pair) => {
            pair.socketIDs.forEach((socketID) => {
              if (channel.members.includes(pair.id)) {
                io.to(socketID).emit("s_ChannelMessage", newMessage);
              }
            });
          });
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

        socket.on("deleteChannelMessage", async (data) => {
          // Find all socket ID of users
          if (pairIDs === null) {
            return;
          }

          const channel = await Channel.findById(data.channel_id);

          pairIDs.forEach((pair) => {
            pair.socketIDs.forEach((socketID) => {
              if (channel.members.includes(pair.id)) {
                io.to(socketID).emit("deleteChannelMessage", data);
              }
            });
          });
        });

        socket.on("update_channel", () => {
          io.emit("update_channel");
        });

        socket.on("direct_call", async (data) => {
          pairIDs.forEach((pair) => {
            pair.socketIDs.forEach((socketID) => {
              if (pair.id === data.to_id) {
                io.to(socketID).emit("direct_call", data);
              }
            });
          });
        });

        socket.on("channel_call", async (data) => {
          const channel = await Channel.findById(data.channel_id);

          pairIDs.forEach((pair) => {
            pair.socketIDs.forEach((socketID) => {
              if (
                channel.members.includes(pair.id) &&
                pair.id !== data.from_id
              ) {
                io.to(socketID).emit("channel_call", data);
              }
            });
          });
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

        socket.on("newCall", (id, channel) => {
          socket.join(channel);
          socket.to(channel).emit("newuserJoinedCall", id);
          socket.on("disconnect", () => {
            socket.to(channel).emit("userLeaveCall", id);
          });
        });

        socket.on("check_online_user", (userId) => {
          io.emit(
            "update_online_user",
            pairIDs.map((pairID) => pairID.id)
          );
        });

        socket.on("disconnect", async () => {
          console.log(
            "User disconnect - SocketID: " + socket.id,
            new Date().toLocaleTimeString()
          );

          const usePairID = pairIDs.find((pair) =>
            pair.socketIDs.includes(socket.id)
          );
          if (usePairID == null) {
            console.log("Error: Cannot find socket ID");
          } else {
            let index = usePairID.socketIDs.indexOf(socket.id);
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
            "update_online_user",
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
  const decodedToken = verifyAccessToken(token);
  console.log(decodedToken.status);
  if (decodedToken.status == 403) {
    return null;
  } else if (decodedToken.status == 200) {
    const userExist = await User.exists({ _id: decodedToken.data._id });
    if (userExist) {
      const user = await User.findById(decodedToken.data._id);
      return user;
    } else {
      return null;
    }
  }
};

module.exports = socket;
