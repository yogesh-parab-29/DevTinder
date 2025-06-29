const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "interested", "rejected", "accepted"],
        message:`{VALUE} is incorrect status type`
      },
    },
  },
  {
    timestamps: true,
  }
);
connectionRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true }
);

const connectionRequestModel = new mongoose.model("ConnectionRequest",connectionRequestSchema)

module.exports = connectionRequestModel;
