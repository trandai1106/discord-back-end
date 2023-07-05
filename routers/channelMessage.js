const router = require("express").Router();
const bcrypt = require("bcrypt");

const authMiddleware = require("../middleware/auth");
const User = require("../models/user");
const ChannelMessage = require("../models/channelMessage");

// Get all channel messages
router.get("/:channelId", async (req, res) => {
  const messages = await ChannelMessage.find({
    channelId: req.params.channelId,
  });
  messages.sort((m1, m2) => m1.created_at - m2.created_at);
  res.send({
    status: 1,
    message: "Get room messages successful",
    data: {
      messages: messages,
    },
  });
});

// Delete channel messages by id
router.delete("/delete/:id", (req, res) => {
  ChannelMessage.findByIdAndDelete(req.params.id)
    .then((data) => {
      res.send({
        status: 1,
        message: "Delete message succesful",
        data: data,
      });
    })
    .catch((err) => {
      res.send({
        status: 0,
        message: "Error while deleting message",
        data: err,
      });
    });
});

module.exports = router;
