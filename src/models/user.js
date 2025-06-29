const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 25,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      // unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email Id format :" + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female"].includes(value)) {
          throw new Error("Gender is not valid");
        }
      },
    },
    about: {
      type: String,
      default: "This is a default about of the user",
    },
    skills: {
      type: [String],
      default: [],
    },
    photoUrl:{
      type: String,
      default:"https://thumbs.dreamstime.com/b/default-avatar-pro…n-vector-social-media-user-portrait-176256935.jpg"
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index({ emailId: 1 }, { unique: true });
const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
