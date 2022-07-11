"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const bcrypt = require("bcrypt");

const app = express();
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectId;
const LocalStrategy = require("passport-local").Strategy;
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
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
    });
  });
  app.post(
    "/login",
    passport.authenticate("local", {
      failureRedirect: "/",
    }),
    (req, res) => {
      res.redirect("/profile");
    }
  );
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
  app.get("/profile", ensureAuthenticated, (req, res) => {
    res.render("profile", {
      username: req.user.username,
    });
  });
  app.get("/logout", (req, res, next) => {
    req.logout();
    res.redirect("/");
  });
  app.route("/register").post((req, res, next) => {
    const password = bcrypt.hashSync(req.body.password, 10);
    myDatabase.findOne({ username: req.body.username }, (err, data) => {
      if (err) {
        next(err);
      } else if (data) {
        res.redirect("/");
      } else {
        myDatabase.insertOne(
          { username: req.body.username, password },
          (err, doc) => {
            if (err) {
              res.redirect("/");
            } else {
              next(null, doc.ops[0]);
            }
          }
        );
      }
    });
  });

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDatabase.findOne({ username: username }, (err, user) => {
        console.log("User " + username + " attempted to login");
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    myDatabase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
