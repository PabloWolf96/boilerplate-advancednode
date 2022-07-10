const passport = require("passport");
const ObjectId = require("mongodb").ObjectId;

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  done(null, null);
});
