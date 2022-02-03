const router = require("express").Router();
const db = require("../database");
router.get("/", (req, res) => {
  res.redirect("/login")
});

module.exports = router;
