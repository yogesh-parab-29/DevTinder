const express = require("express");
const User = require("../models/user");
const userRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userAuth } = require("../middleware/auth");
const connectionRequestModel = require("../models/connectionRequest");
const userModel = require("../models/user");

userRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
    const { firstName, lastName, emailId, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });
    const userData = await newUser.save();
    console.log(userData);
    const token = await jwt.sign({ _id: userData._id }, "SECRETCODE", {
      expiresIn: "1h",
    });
    console.log(token,11);
    res.cookie("token", token);
    
    res
      .status(201)
      .json({ message: "User saved successfully", data: userData });
  } catch (e) {
    res.status(401).send({ message: "Error while user sign up" + e.message });
  }
});

userRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;

  try {
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    const responseDataField = [
      "firstName",
      "lastName",
      "about",
      "skills",
      "emailId",
      "_id",
      "photoUrl",
    ];
    if (isPasswordValid) {
      const token = await jwt.sign({ _id: user._id }, "SECRETCODE");
      const userData = responseDataField.reduce((obj, key) => {
        obj[key] = user[key];
        return obj;
      }, {});
      res.cookie("token", token);
      // res.status(201).json({ data: userData, token: token });
      res.status(201).json({ data: user });
    } else {
      throw new Error("Invalid Credentials");
    }
  } catch (e) {
    res.status(500).json({ message: "error while finding user" });
  }
});

userRouter.patch("/update/:id", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;
  try {
    const ALLOWED_UPDATES = [
      "age",
      "firstName",
      "lastName",
      "skills",
      "gender",
      "about",
      "photoUrl",
    ];

    const isUpdateAllowed = Object.keys(data).every((k) => {
      ALLOWED_UPDATES.includes(k);
    });

    if (!isUpdateAllowed) {
      throw new Error("One of the updated field cannot be changed");
    }
    const user = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(201).send({ message: "User updated successfully" });
  } catch (e) {
    res.status(501).send({ message: "Unable to retract user" });
  }
});

userRouter.post("/logout", (req, res) => {
  try {
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
    });
    res.status(200).send({ message: "User logged out successfully" });
  } catch (e) {
    res.status(404).send({ message: "Error while logging out user." });
  }
});

userRouter.get("/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    // console.log(loggedInUser._id);
    const connectionRequest = await connectionRequestModel
      .find({
        toUserId: loggedInUser._id,
        status: "interested",
      })
      .populate("fromUserId", [
        "firstName",
        "lastName",
        "age",
        "gender",
        "photoUrl",
        "about",
      ]);
    // console.log(connectionRequest);
    res.status(200).json({
      message: "Data fetched successfully",
      data: connectionRequest,
    });
  } catch (error) {
    console.error("Error in /requests/received:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

userRouter.get("/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connections = await connectionRequestModel
      .find({
        $or: [
          {
            toUserId: loggedInUser._id,
            status: "accepted",
          },
          {
            fromUserId: loggedInUser._id,
            status: "accepted",
          },
        ],
      })
      .populate("fromUserId", [
        "firstName",
        "lastName",
        "age",
        "gender",
        "photoUrl",
        "about",
      ])
      .populate("toUserId", [
        "firstName",
        "lastName",
        "age",
        "gender",
        "photoUrl",
        "about",
      ]);

    const data = connections.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    res.status(200).json({
      message: "Data fetched successfully",
      data,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Unable to fetch connections, please try again later" });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    limit = Math.min(limit, 50);
    const connectionRequest = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      })
      .select("fromUserId toUserId");

    const interactedUser = new Set();
    connectionRequest.forEach((req) => {
      interactedUser.add(req.toUserId.toString());
      interactedUser.add(req.fromUserId.toString());
    });

    const totalUsers = await userModel.countDocuments({
      $and: [
        {
          _id: {
            $nin: Array.from(interactedUser),
          },
        },
        { _id: { $ne: loggedInUser._id } },
      ],
    });

    const users = await userModel
      .find({
        $and: [
          {
            _id: {
              $nin: Array.from(interactedUser),
            },
          },
          { _id: { $ne: loggedInUser._id } },
        ],
      })
      // .select("firstName lastName")
      .select("firstName lastName age gender skills about photoUrl")
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      // currentPage: page,
      // totalPages: Math.ceil(totalUsers / limit),
      // usersPerPage: limit,
    });
  } catch (error) {
    res.status(501).json({
      message: error.message,
    });
  }
});

module.exports = userRouter;
