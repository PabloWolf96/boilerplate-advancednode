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
  })
);
app.use(passport.initialize());
app.use(passport.session());

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
  });
}).catch((err) => {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: e,
      message: "Unable to login",
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
