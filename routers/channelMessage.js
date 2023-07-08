const router = require("express").Router();
const bcrypt = require("bcrypt");

const authMiddleware = require("../middleware/auth");
const User = require("../models/user");
const ChannelMessage = require("../models/channelMessage");

// Get all channel messages
router.get("/:channelId", async (req, res) => {
  const messages = await ChannelMessage.find({
    channel_id: req.params.channelId,
  });
  messages.sort((m1, m2) => m1.created_at - m2.created_at);
  res.send({
    status: 1,
    message: "Get channel messages successful",
    data: messages,
  });
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
