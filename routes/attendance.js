const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/rsvp', async (req, res) => {
  // Find next meeting and show it to user
  // TODO: This actually doesn't work
  const meetingResp = await db.query("SELECT * FROM meetings ORDER BY date LIMIT 1");
  if (meetingResp.rows.length > 0) {
    let rsvped = false;
    if (req.user) {
      let rsvpResp = await db.query("SELECT * FROM rsvps WHERE user_id = $1", [req.user.id]);
      rsvped = rsvpResp.rows.length > 0;
    }
    res.render('rsvp', { title: 'RSVP', meeting: meetingResp.rows[0], rsvped: rsvped });
  }
  else {
    res.render('rsvp', { title: 'RSVP', meeting: false });
  }
});

router.post('/rsvp', async (req, res) => {
  // use logged in credentials if possible
  let user_id;
  let name;

  if (req.body.user_id && req.body.name) {
    // user is submitting with form data
    user_id = req.body.user_id;
    name = req.body.name;
  }
  else {
    user_id = req.user.id;
    name = req.user.name;
  }

  // If id or name is still null, something went very wrong
  if (!user_id || !name) {
    req.flash('error', 'Something went wrong when trying to track your RSVP! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if user has RSVP'ed already
  const rsvp = await db.query("SELECT 1 FROM rsvps WHERE user_id = $1 AND meeting = $2", [user_id, req.body.meeting_id]);
  if (rsvp.rows.length > 0) {
    req.flash('error', 'You have already RSVP\'ed for this event!');
    res.redirect('/');
  }
  else {
    await db.query("INSERT INTO rsvps VALUES ($1, $2, $3)", [req.body.meeting_id, user_id, name]);
    req.flash('success', 'Successfully RSVP\'ed! Thanks for coming.');
    res.redirect('/');
  }
});

router.get('/attend', async (req, res) => {
  // Find active meeting if possible (2 hour buffer) TODO there's probably a better way to do this
  const meetingResp = await db.query("SELECT * FROM meetings WHERE date >= NOW() - INTERVAL '2 hours' and date <= NOW() + INTERVAL '2 hours'");
  if (meetingResp.rows.length > 0) {
    let rsvped = false;
    if (req.user) {
      const rsvpResp = await db.query("SELECT * FROM attendance WHERE user_id = $1 AND meeting = $2", [req.user.id, meetingResp.rows[0].id]);
      rsvped = rsvpResp.rows.length > 0;
    }
    res.render('attend', { title: 'Attend', meeting: meetingResp.rows[0], rsvped: rsvped });
  }
  else {
    res.render('attend', { title: 'Attend', meeting: false });
  }
});

router.post('/attend', async (req, res) => {
  // use logged in credentials if possible
  let user_id;
  let name;

  if (req.body.user_id && req.body.name) {
    // user is submitting with form data
    user_id = req.body.user_id;
    name = req.body.name;
  }
  else {
    user_id = req.user.id;
    name = req.user.name;
  }

  // If id or name is still null, something went very wrong
  if (!user_id || !name) {
    req.flash('error', 'Something went wrong when trying to track your RSVP! Please contact a site administrator.');
    res.redirect('/');
  }

  // Check if submitted already
  const attendance = await db.query("SELECT * FROM attendance WHERE user_id = $1 AND meeting = $2", [user_id, req.body.meeting_id]);
  if (attendance.rows.length > 0) {
    req.flash('error', 'You have already submitted an attendance form for this event!');
    res.redirect('/');
  } else {
    if (req.body.feedback) {
      await db.query("INSERT INTO feedback VALUES ($1, $2)", [user_id, req.body.feedback]);
    }
    await db.query("INSERT INTO attendance VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [req.body.meeting_id, user_id, name]);
    req.flash('success', 'Your attendance has been logged! Thanks for coming.')
    res.redirect('/');
  }
});

module.exports = router;
