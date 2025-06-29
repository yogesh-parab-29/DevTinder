const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const { validateProfileEditData } = require("../utils/validation");

profileRouter.get("/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("No user found");
    }
    res.send(user);
  } catch (e) {
    res.status(401).send("Errors : " + e.message);
  }
});

profileRouter.patch("/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Invalid Edit request");
    }
    const user = req.user;
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });
    await user.save();

    res.status(200).json({ message: "Updated successfully", data: user });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});
module.exports = profileRouter;
