const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/rsvp', async (req, res) => {
  // use logged in credentials if possible
  let email;
  let name;

  if (req.body.name && req.body.email) {
    // user is submitting with form data
    email = req.body.email;
    name = req.body.name;
  }
  else {
    email = req.user.email;
    name = req.user.name;
  }

  // If email or name is still null, something went very wrong
  if (email === undefined || name === undefined) {
    req.flash('error', 'Something went wrong when trying to track your RSVP! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if user has RSVP'ed already
  const rsvp = await db.query("SELECT 1 FROM rsvps WHERE email = $1 AND meeting = $2", [email, req.body.id]);
  if (rsvp.rows.length > 0) {
    req.flash('error', 'You have already RSVP\'ed for this event!');
    res.redirect('/');
  }
  else {
    await db.query("INSERT INTO rsvps VALUES ($1, $2, $3)", [req.body.id, name, email]);
    req.flash('success', 'Successfully RSVP\'ed! Thanks for coming.');
    res.redirect('/');
  }
});

router.get('/attend', async (req, res) => {
  // Find active meeting if possible (2 hour buffer) TODO there's probably a better way to do this
  const resp = await db.query("SELECT * FROM meetings WHERE date >= NOW() - INTERVAL '2 hours' and date <= NOW() + INTERVAL '2 hours'");
  if (resp.rows.length > 0) {
    const rsvp = await db.query("SELECT * FROM attendance WHERE email = $1 AND meeting = $2", [req.user.email, resp.rows[0].id]);
    let rsvped = false;

    if (rsvp.rows.length > 0) {
      rsvped = true;
    }
    res.render('attend', { title: 'Attend', meeting: resp.rows[0], rsvped: rsvped });
  }
  else {
    res.render('attend', { title: 'Attend', meeting: false });
  }
});

router.post('/attend', async (req, res) => {
  // use logged in credentials if possible
  let email;

  if (req.body.email) {
    // user is submitting with form data
    email = req.body.email;
  }
  else {
    email = req.user.email;
  }

  // If email or name is still null, something went very wrong
  if (email === undefined) {
    req.flash('error', 'Something went wrong when trying to track your form attendance! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if submitted already
  const attendance = await db.query("SELECT 1 FROM attendance WHERE email = $1 AND meeting = $2", [email, req.body.meetingId]);
  if (attendance.rows.length > 0) {
    req.flash('error', 'You have already submitted an attendance form for this event!');
    res.redirect('/');
  }
  else {
    if (req.body.feedback) {
      await db.query("INSERT INTO feedback VALUES ($1, $2)", [email, req.body.feedback]);
    }
    await db.query("INSERT INTO attendance VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.body.meetingId, email]);
    req.flash('success', 'Your attendance has been logged! Thanks for coming.')
    res.redirect('/');
  }
});

module.exports = router;
