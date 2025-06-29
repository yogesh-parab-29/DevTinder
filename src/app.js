const express = require("express");
const db = require("./db/db.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/user.js");
const profileRouter = require("./routes/profile.js");
const requestRouter = require("./routes/request.js");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/user", userRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);

db()
  .then(() => {
    console.log("database connected");
    app.listen(3000, () => {
      console.log("Server is running");
    });
  })
  .catch((err) => {
    console.log("couldnt connect to database");
  });
