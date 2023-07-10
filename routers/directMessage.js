const router = require("express").Router();

const authMiddleware = require("../middleware/auth");
const User = require("../models/user");
const DirectMessage = require("../models/directMessage");
const directMessage = require("../models/directMessage");

router.get("/to/:to_id", authMiddleware.requireLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const to_id = req.params.to_id;

    const messages = await directMessage.find({
      $or: [
        { from_id: userId, to_id: to_id },
        { from_id: to_id, to_id: userId },
      ],
    });
    messages.sort((m1, m2) => m1.created_at - m2.created_at);
    res.send({
      status: 1,
      message: "Get direct messages two people successful",
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

// Get message by content
router.post("/search", async (req, res) => {
  try {
    const from_id = req.body.from_id;
    const to_id = req.body.to_id;
    const query = req.query.q;

    console.log(from_id, to_id, query);

    const messages = await directMessage.find({
      $or: [
        { from_id: from_id, to_id: to_id },
        { from_id: to_id, to_id: from_id },
      ],
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

router.get("/contacted", authMiddleware.requireLogin, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user == null) {
    return res.send({
      status: 0,
      message: "Unknown error",
    });
  }

  var data = [];

  var contactedUsers = [];
  if (user.contacted_users) {
    contactedUsers = user.contacted_users;
  }

  for (var i = 0; i < contactedUsers.length; i++) {
    // var lastMsg = await DirectMessage.findOne({  })

    const lastMessagesFromUser = await DirectMessage.findOne({
      from_id: contactedUsers[i],
      to_id: user._id,
    }).sort({ created_at: -1 });
    const lastMessagesToUser = await DirectMessage.findOne({
      from_id: user._id,
      to_id: contactedUsers[i],
    }).sort({ created_at: -1 });

    if (lastMessagesFromUser == null && lastMessagesToUser == null) {
    } else if (lastMessagesFromUser != null && lastMessagesToUser == null) {
      data.push({
        user_id: contactedUsers[i],
        last_message: lastMessagesFromUser,
      });
    } else if (lastMessagesFromUser == null && lastMessagesToUser != null) {
      data.push({
        user_id: contactedUsers[i],
        last_message: lastMessagesToUser,
      });
    } else {
      // lastMessagesFromUser != null && lastMessagesToUser != null
      if (lastMessagesFromUser.created_at > lastMessagesToUser.created_at) {
        data.push({
          user_id: contactedUsers[i],
          last_message: lastMessagesFromUser,
        });
      } else {
        data.push({
          user_id: contactedUsers[i],
          last_message: lastMessagesToUser,
        });
      }
    }
  }

  res.send({
    status: 1,
    message: "Get messages history successful",
    data: data,
  });
});

// Get all messages
router.get("/all", async (req, res) => {
  const messages = await DirectMessage.find({});
  res.send(messages);
});

router.delete("/delete/all", (req, res) => {
  const user1 = req.body.user1;
  const user2 = req.body.user2;
  DirectMessage.deleteMany({
    $or: [
      { from_id: user1, to_id: user2 },
      { from_id: user2, to_id: user1 },
    ],
  })
    .then((data) => {
      res.send({
        status: 1,
        message: "Delete messages succesful",
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

// Delete direct message by id
router.delete("/delete/:id", (req, res) => {
  DirectMessage.findByIdAndDelete(req.params.id)
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
