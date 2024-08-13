const express = require("express");
const { isAdminAuthenticated } = require("../middleware");
const router = express.Router();

app.get(
  "/gallery",
  fallible(async (req, res) => {
    const images = await db.query("SELECT * FROM images");
    res.render("gallery", { title: "Gallery", images: images.rows });
  }),
);

app.post(
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
