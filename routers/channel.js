const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/user");
const Channel = require("../models/channel");
const ChannelMessage = require("../models/channelMessage");

router.get("/joined", authMiddleware.requireLogin, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Channel.find({
      members: { $in: [userId] },
    });

    res.send({
      status: 1,
      message: "Get joined channels successfull",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch joined channels" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const result = await Channel.find();
    res.send({
      status: 1,
      message: "Get channel information successfull",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat channel" });
  }
});

router.get("/information/:channelId", async (req, res) => {
  try {
    const result = await Channel.findById(req.params.channelId);
    res.send({
      status: 1,
      message: "Get room information successfull",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat channel" });
  }
});

// Create channel
router.post("/create", async (req, res) => {
  try {
    const { admin, name } = req.body;

    if (name.trim() === "" || name === null) {
      return res.send({
        status: 0,
        message: "Channel name cannot be empty",
      });
    }

    const isExist = await Channel.findOne({ name });
    if (isExist != null) {
      return res.send({
        status: 0,
        message: "Channel is already exist",
      });
    }

    const result = await Channel.create({
      name,
      members: [admin],
      admin: admin,
    });

    res.send({
      status: 1,
      message: "Create channel successful",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: 0, message: "Failed to create channel" });
  }
});

// Delete channel
router.post("/delete", authMiddleware.requireLogin, async (req, res) => {
  try {
    const roomdId = req.body.channelId;

    const messages = await ChannelMessage.find({
      channelId: req.params.channelId,
    });

    messages.forEach((message) => {
      ChannelMessage.findByIdAndDelete(message._id);
    });

    const result = await Channel.findByIdAndDelete(roomdId);

    res.send({
      status: 1,
      message: "Delete channel successful",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: 0, message: "Failed to delete channel" });
  }
});

// Get members in channel
router.get("/members/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;

    const channel = await Channel.findById(channelId);
    const users = await User.find({}).select("email name id avatar_url");

    const result = users.filter((user) => channel.members.includes(user._id));

    res.send({
      status: 1,
      message: "Get users successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error get users",
    });
  }
});

// Get people not in channel
router.get("/notmember/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;

    const channel = await Channel.findById(channelId);
    const users = await User.find({}).select("email name id avatar_url");

    const result = users.filter((user) => !channel.members.includes(user._id));

    res.send({
      status: 1,
      message: "Get users successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error get users",
    });
  }
});

// Search members in channel by name
router.get("/search/members/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const query = req.query.q;

    const channel = await Channel.findById(channelId);
    const users = await User.find({ name: new RegExp(query, "i") }).select(
      "email name id avatar_url"
    );

    const result = users.filter((user) => channel.members.includes(user._id));

    res.send({
      status: 1,
      message: "Search users successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error searching users",
    });
  }
});

// Search people not in channel by name
router.get("/search/notmember/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const query = req.query.q;

    const channel = await Channel.findById(channelId);
    const users = await User.find({ name: new RegExp(query, "i") }).select(
      "email name id avatar_url"
    );

    const result = users.filter((user) => !channel.members.includes(user._id));

    res.send({
      status: 1,
      message: "Search users successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error searching users",
    });
  }
});

router.post("/add/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const userId = req.body.userId;

    const channel = await Channel.findById(channelId);

    if (channel.members.includes(userId)) {
      return res.send({
        status: 0,
        message: "Error: User is already member",
      });
    }

    const result = await Channel.findByIdAndUpdate(
      channelId,
      { $push: { members: userId } },
      { new: true }
    );

    res.send({
      status: 1,
      message: "Add member successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error add member",
    });
  }
});

router.post("/delete/:channelId", async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const userId = req.body.userId;

    const channel = await Channel.findById(channelId);

    if (!channel.members.includes(userId)) {
      return res.send({
        status: 0,
        message: "Error: User not a member",
      });
    }

    const result = await Channel.findByIdAndUpdate(channelId, {
      $pull: { members: userId },
    });

    res.send({
      status: 1,
      message: "Delete member successful",
      data: result,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error delete member",
    });
  }
});

module.exports = router;
