const router = require("express").Router();
const passport = require("passport");
const db = require('../database');
const { isNotLoggedIn } = require("../lib/auth");


router.get("/login", isNotLoggedIn, (req, res) => {
  res.render("auth/login", { title: "Login Maple", noMaterialize: true });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local.login", {
    successRedirect: "/redirect",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});


router.get("/redirect", (req, res, next) => {
  
  console.log("ESTE ES EL IDDDDDDDDDDDDDDDDDDDDDD",req.user.PER_CNIVEL);
      if (req.user.PER_CNIVEL == 'SUPERVISOR') {
        res.redirect('GECARep/reportes');
      } else if (req.user.PER_CNIVEL == 'AGENTE') {
        res.redirect('GECA/transferencias');
      } else if (req.user.PER_CNIVEL == 'BACKOFFICE') {
        res.redirect('GECA/backoffice');
      }
});




router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

module.exports = router;
