const express = require('express');
const uuid = require('uuid');
const db = require('../database/db');
const { fallible } = require("../middleware");
const router = express.Router();

const parsePresentationId = (body) => {
  if (!uuid.validate(body.presentation_id)) {
    throw new TypeError("Invalid presentation id");
  }
  
  return body.presentation_id;
}

const parsePresentationInfo = (body) => {
  const presentation = {};

  if (typeof body.title === "string" && body.title.length > 0) {
    presentation.title = body.title;
  } else {
    throw new TypeError("Invalid presentation title");
  }

  if (typeof body.description === "string" && body.description.length > 0) {
    presentation.description = body.description;
  } else {
    throw new TypeError("Invalid presentation description");
  }

  // Ensure the presentation's date resolves to a valid timestamp. Date only indicates this
  // by having a NaN time (which is really hard to accurately check), or having a string
  // representation of "Invalid date". Do the latter since it's less of a footgun.
  if (typeof body.date === "string" && new Date(body.date).toString() !== "Invalid Date") {
    presentation.date = body.date;
  } else {
    throw new TypeError("Invalid presentation date");
  }

  // TODO: We should probably also be validating URLs and the like
  if (typeof body.url === "string" && body.url.length > 0) {
    presentation.url = body.url;
  } else {
    throw new TypeError("Invalid presentation url");
  }

  return presentation;
}

router.get('/presentations', fallible(async (req, res) => {
  const presentationsResp = await db.query("SELECT * FROM presentations ORDER BY date DESC");
  for (presentation of presentationsResp.rows) {
    // Just cleave off the time value randomly added for no reason
    // by JS Date, not bringing in Moment.js for just this.
    presentation.date = presentation.date.toISOString().split("T")[0];
  }
  res.render('presentations', { title: 'Presentations', presentations: presentationsResp.rows });
}));

router.post('/presentations', fallible(async (req, res) => {
  const presentation = parsePresentationInfo(req.body);
  presentation.id = uuid.v4();

  await db.query("INSERT INTO presentations VALUES ($1, $2, $3, $4, $5)", 
    [presentation.id, presentation.title, presentation.description,
      presentation.date, presentation.url]);
  
  req.flash('success', 'Successfully added presentation!');
  res.redirect('/presentations');
}));

router.post('/presentations/edit', fallible(async (req, res) => {
  const presentation = parsePresentationInfo(req.body);
  presentation.id = parsePresentationId(req.body);

  await db.query("UPDATE presentations SET title = $1, description = $2, date = $3, url = $4 WHERE id = $5", 
    [presentation.title, presentation.description, presentation.date, presentation.url, presentation.id]);

  req.flash('success', 'Successfully edited presentation!');
  res.redirect('/presentations');
}));

router.post('/presentations/delete', fallible(async (req, res) => {
  const presentationId = parsePresentationId(req.body);

  await db.query("DELETE FROM presentations WHERE id = $1", [presentationId]);

  req.flash('success', 'Successfully deleted presentation!');
  res.redirect('/presentations');
}));

module.exports = router;
