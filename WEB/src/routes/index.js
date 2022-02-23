const router = require("express").Router();
const db = require("../database");

router.get("/", (req, res) => {
  res.redirect("/login")
});

router.get("/redirect", (req, res) => {
  console.log(req.user);
})

module.exports = router;
