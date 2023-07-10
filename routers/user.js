const router = require("express").Router();
const uuid4 = require("uuid4");

const authMiddleware = require("../middleware/auth");
const User = require("../models/user");
const DirectMessage = require("../models/directMessage");
const ChannelMessage = require("../models/channelMessage");
const Image = require("../models/image");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    const users = await User.find({ name: new RegExp(query, "i") }).select(
      "email name id avatar_url"
    );
    res.send({
      status: 1,
      message: "Search users successful",
      data: users,
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error searching users",
    });
  }
});

// Get all users
router.get("/all", (req, res) => {
  User.find({})
    .then((users) => {
      res.send({
        status: 1,
        message: "Get users successful",
        data: users,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

router.get("/information/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      res.send({
        status: 1,
        message: "Get user information successful",
        data: {
          email: user.email,
          name: user.name,
          id: user._id,
          avatar: user.avatar_url,
        },
      });
    } else {
    }
  } catch (err) {
    res.send({
      status: 0,
      message: "Error while getting user information",
    });
  }
});

// Update user information
router.put("/update/:userId", async (req, res) => {
  try {
    // const { name, email } = req.body;
    const name = req.body.name;
    const userId = req.params.userId;

    console.log(name, userId);

    const user = await User.findByIdAndUpdate(userId, {
      name: name,
    });

    res.send({
      status: 1,
      message: "User information updated successfully",
      data: {
        email: user.email,
        name: name,
        id: user._id,
        avatar: user.avatar_url,
      },
    });
  } catch (err) {
    res.send({
      status: 0,
      message: "Error while updating user information",
    });
  }
});

// Upload user avatar
router.post("/avatar/:userId", upload.single("file"), async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).send({
        status: 0,
        message: "There was an error while uploading the file",
      });
    }

    const imageData = req.file.buffer.toString("base64");
    const existingImage = await Image.findOne({ user: userId });

    if (existingImage) {
      await Image.findOneAndUpdate(
        { user: userId },
        {
          data: imageData,
        }
      );

      res.send({
        status: 1,
        message: "Image uploaded successfully",
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        avatar_url: "/users/images/" + userId,
      });
      await Image.create({
        user: userId,
        data: imageData,
      });

      res.send({
        status: 1,
        message: "Image uploaded successfully",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: 0,
      message: "Error while uploading image",
    });
  }
});

// Get all the images
router.get("/images/all", async (req, res) => {
  const image = await Image.find();
  res.send({
    status: 1,
    data: image,
  });
});

// Get image from database
router.get("/images/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const image = await Image.findOne({ user: id });

    if (!image) {
      return res.status(404).send({
        status: 0,
        message: "Image not found",
      });
    }

    const imageData = Buffer.from(image.data, "base64");
    res.set("Content-Type", "image/jpeg");
    res.send(imageData);
  } catch (error) {
    res.status(500).send({
      status: 0,
      message: "Get image fail",
    });
  }
});

router.delete("/images/:id", async (req, res) => {
  Image.findOneAndDelete({ user: req.params.id })
    .then((data) => res.send("delete successfuly"))
    .catch((error) => res.status(500).send("Error deleting image"));
});

// Delete user by id
router.delete("/delete/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((users) => {
      DirectMessage.deleteMany({
        $or: [{ from_id: req.params.id }, { to_id: req.params.id }],
      })
        .then(() => {
          ChannelMessage.deleteMany({
            from_id: req.params.id,
          })
            .then(() => {
              res.send({
                status: 1,
                message: "Delete user successful",
                data: users,
              });
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

module.exports = router;
