const bcrypt = require("bcrypt");
const passport = require("passport");
const { render } = require("pug");
module.exports = (app, myDatabase) => {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
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
  app.get(
    "/auth/github",
    passport.authenticate("github", {
      failureRedirect: "/",
    })
  );
  app.get(
    "/auth/github/callback",
    passport.authenticate("github", {
      failureRedirect: "/",
    }),
    (req, res) => {
      req.session.user._id = req.user.id;
      res.redirect("/chat");
    }
  );
  app.get("/chat", ensureAuthenticated, (req, res) => {
    render("chat", {
      user: req.user,
    });
  });
  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};
