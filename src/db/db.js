const mongoose = require("mongoose");
const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://devAdmin:devAdmin@cluster0.gfettfg.mongodb.net/"
  );
};

module.exports = connectDB;
