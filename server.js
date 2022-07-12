"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const routes = require("./routes");
const auth = require("./auth");
const session = require("express-session");
const passport = require("passport");

fccTesting(app); //For FCC testing purposes
const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", "./views/pug");
app.set("view engine", "pug");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);
myDB(async (client) => {
  const myDatabase = await client.db("database").collection("users");
  routes(app, myDatabase);
  auth(app, myDatabase);
  let currentUsers = 0;
  io.on("connection", (socket) => {
    console.log("a user connected");
    ++currentUsers;
    io.emit("user count", currentUsers);
    console.log("new user connected");
    socket.on("disconnect", () => {
      console.log("A user has disconnected");
      --currentUsers;
      io.emit("user count", currentUsers);
    });
  });
}).catch((err) => {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: e,
      message: "Unable to login",
    });
  });
});
function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
