const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const UserModel = require("../models/user");

profileRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    const allowedStatus = ["interested", "rejected"];

    if (!allowedStatus.includes(status)) {
      res.status(400).json({ message: "Invalid status request : " + status });
    }

    const toUser = await UserModel.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "User doesnt exist!" });
    }

    if (fromUserId.toString() === toUserId.toString()) {
      console.log(fromUserId);
      console.log(toUserId);
      return res.json({ message: "User cannot send request to self" });
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        {
          fromUserId,
          toUserId,
        },
        {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      ],
    });
    if (existingConnectionRequest) {
      return res.json({
        message: "Connection request already exist",
      });
    }
    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const data = await connectionRequest.save();

    res.json({
      message: `${
        status === "interested"
          ? "Interest request sent successfully"
          : "Rejection request sent successfully"
      }`,
      data,
    });
  } catch (e) {
    res.status(400).send("Error:" + e.message);
  }
});

profileRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const status = req.params.status;
    const requestId = req.params.requestId;

    const acceptableStatus = ["accepted", "rejected"];

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      res.status(404).json({ message: "Request does not exist" });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();

    res.status(200).json({
      message: "Request has been " + status,
      data,
    });
  } catch (error) {
    res.status(501).json({ message: "Something went wrong while " });
  }
});

module.exports = profileRouter;
