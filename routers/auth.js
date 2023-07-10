const router = require("express").Router();
const dataValidation = require("../utils/dataValidation");
const security = require("../utils/security");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("login request " + email + " - " + password);

  const user = await User.findOne({ email: email });
  if (user) {
    const checkPassword = await security.verifyPassword(
      password,
      user.encrypted_password
    );
    if (checkPassword) {
      const newAT = security.generateAccessToken(user);
      const newRT = security.generateRefreshToken(user);
      console.log("right password");
      return res.send({
        status: 1,
        message: "OK",
        data: {
          access_token: newAT,
          refresh_token: newRT,
          id: user._id,
        },
      });
    } else {
      console.log("incorrect password");
      return res.send({
        status: 0,
        message: "Password is incorrect",
      });
    }
  } else {
    return res.send({
      status: 0,
      message: "User is not exist",
    });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("register request " + email + " - " + password);
  if (!dataValidation.isArrayHasBlankOrNullElement([name, email, password])) {
    const isExistEmail = await User.exists({ email: email });
    if (isExistEmail) {
      return res.send({
        status: 0,
        message: "This email already in use",
      });
    }

    const encrypted_password = await security.encryptPassword(password);
    const user = await User.create({ name, email, encrypted_password });

    const newAT = security.generateAccessToken(user);
    const newRT = security.generateRefreshToken(user);
    return res.send({
      status: 1,
      message: "OK",
      data: {
        access_token: newAT,
        refresh_token: newRT,
        id: user._id,
      },
    });
  } else {
    return res.send({
      status: 0,
      message: "Fail",
    });
  }
});

router.get("/profile", authMiddleware.requireLogin, async (req, res) => {
  if (req.user) {
    res.send({
      status: 1,
      message: "Get user information successful",
      data: {
        user: {
          email: req.user.email,
          name: req.user.name,
          id: req.user._id,
          avatar: req.user.avatar_url,
        },
      },
    });
  } else {
    res.send({
      status: 0,
      message: "Error",
    });
  }
});

module.exports = router;
