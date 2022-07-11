const LocalStrategy = require("passport-local").Strategy;
const GithubStrategy = require("passport-github").Strategy;
const bcrypt = require("bcrypt");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectId;
module.exports = (app, myDatabase) => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    myDatabase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
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
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
      }
    )
  );
};
