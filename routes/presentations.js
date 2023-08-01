const express = require('express');
const uuid = require('uuid');
const db = require('../database/db');
const router = express.Router();

router.get('/presentations', async (req, res) => {
  const resp = await db.query("SELECT * FROM presentations ORDER BY date DESC");
  for (presentation of resp.rows) {
    // Just cleave off the time value randomly added for no reason
    // by JS Date, not bringing in Moment.js for just this.
    presentation.date = presentation.date.toISOString().split("T")[0];
  }
  res.render('presentations', { title: 'Presentations', presentations: resp.rows });
});

router.post('/presentations', async (req, res) => {
  await db.query("INSERT INTO presentations VALUES ($1, $2, $3, $4, $5)", 
    [uuid.v4(), req.body.title, req.body.description, req.body.date, req.body.url]);
  req.flash('success', 'Successfully added project!');
  res.redirect('/presentations');
});

router.post('/presentations/edit', async (req, res) => {
  await db.query("UPDATE presentations SET title = $1, description = $2, date = $3, url = $4 WHERE id = $5", 
    [req.body.title, req.body.description, req.body.date, req.body.url, req.body.presentation_id]);
  req.flash('success', 'Successfully edited project!');
  res.redirect('/presentations');
});

router.post('/presentations/delete', async (req, res) => {
  await db.query("DELETE FROM presentations WHERE id = $1", [req.body.presentation_id]);
  req.flash('success', 'Successfully deleted project!');
  res.redirect('/presentations');
});

module.exports = router;
