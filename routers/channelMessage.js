const router = require("express").Router();
const bcrypt = require("bcrypt");

const authMiddleware = require("../middleware/auth");
const Channel = require("../models/channel");
const ChannelMessage = require("../models/channelMessage");

// Get all channel messages
router.get("/:channelId", authMiddleware.requireLogin, async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const userId = req.user.id;

    const channel = await Channel.findById(channelId);

    if (channel.members.includes(userId)) {
      const messages = await ChannelMessage.find({
        channel_id: channelId,
      });
      messages.sort((m1, m2) => m1.created_at - m2.created_at);

      res.send({
        status: 1,
        message: "Get channel messages successful",
        data: messages,
      });
    } else {
      res.send({
        status: 0,
        message: "You are not a member of this channel",
      });
    }
  } catch (err) {
    res.send({
      status: 0,
      message: "Error while getting messages",
      data: err,
    });
  }
});

// Get message by content
router.get("/search/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const query = req.query.q;

    const messages = await ChannelMessage.find({
      channel_id: channelId,
      content: new RegExp(query, "i"),
    });
    messages.sort((m1, m2) => m1.created_at - m2.created_at);

    res.send({
      status: 1,
      message: "Search channel messages successful",
      data: messages,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error while getting messages",
      data: err,
    });
  }
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
