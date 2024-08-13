const express = require("express");
const db = require("../database/db");
const { isAdminAuthenticated, fallible } = require("../middleware");
const router = express.Router();

router.get(
  "/gallery",
  fallible(async (req, res) => {
    const images = await db.query("SELECT * FROM images");
    res.render("gallery", { title: "Gallery", images: images.rows });
  }),
);

router.post(
  "/gallery",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    const active =
      req.body.active === "true" || req.body.activeHidden === "false";
    await db.query("UPDATE images SET active = $1 WHERE id = $2", [
      active,
      req.body.image_id,
    ]);
    res.redirect("/gallery");
  }),
);

module.exports = router;
