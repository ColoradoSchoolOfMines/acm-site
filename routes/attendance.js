const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/rsvp', async(req, res) => {
  if(req.query.meeting) {
    // Find next meeting and show it to user
    const resp = await db.query("SELECT * FROM meetings WHERE id = $1", [req.query.meeting]);
    if(resp.rows.length > 0) {
      res.render('rsvp', { title: 'RSVP', meeting: resp.rows[0] });
    }
    else {
      res.render('rsvp', { title: 'RSVP', meeting: false });
    }
  }
  else {
    res.render('rsvp', { title: 'RSVP', meeting: false });
  }
});

router.post('/rsvp', async(req, res) => {
  // use logged in credentials if possible
  let email;
  let name;

  if(req.body.name && req.body.email) {
    // user is submitting with form data
    email = req.body.email;
    name = req.body.name;
  }
  else {
    email = req.user.email;
    name = req.user.full;
  }

  // If email or name is still null, something went very wrong
  if(email === undefined || name === undefined) {
    req.flash('error', 'Something went wrong when trying to track your RSVP! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if user has RSVP'ed already
  const rsvp = await db.query("SELECT 1 FROM rsvps WHERE email = $1", [req.user.email]);
  if(rsvp.rows.length > 0) {
    req.flash('error', 'You have already RSVP\'ed for this event!');
    res.redirect('/');
  }
  else {
    await db.query("INSERT INTO rsvps VALUES ($1, $2, $3)", [req.body.meetingId, name, email]);
    req.flash('success', 'Successfully RSVP\'ed! Thanks for coming.');
    res.redirect('/');
  }
});

router.get('/attend', async (req, res) => {
  // Find active meeting if possible (assumes 1 meeting per day)
  const resp = await db.query("SELECT * FROM meetings WHERE date >= NOW()");
  if(resp.rows.length > 0) {
    res.render('attend', { title: 'Attend', meeting: resp.rows[0] });
  }
  else {
    res.render('attend', { title: 'Attend', meeting: false });
  }
});

router.post('/attend', async(req, res) => {
  // use logged in credentials if possible
  let email;

  if(req.body.email) {
    // user is submitting with form data
    email = req.body.email;
  }
  else {
    email = req.user.email;
  }

  // If email or name is still null, something went very wrong
  if(email === undefined) {
    req.flash('error', 'Something went wrong when trying to track your form attendance! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if submitted already
  const attendance = await db.query("SELECT 1 FROM attendance WHERE email = $1 AND meeting = $2", [email, req.body.meetingId]);
  if(attendance.rows.length > 0) {
    req.flash('error', 'You have already submitted an attendance form for this event!');
    res.redirect('/');
  }
  else {
    await db.query("INSERT INTO attendance VALUES ('" + req.body.meetingId + "', '" + email + "') ON CONFLICT DO NOTHING");
    req.flash('success', 'Your attendance has been logged! Thanks for coming.')
    res.redirect('/');
  }
});

module.exports = router;
