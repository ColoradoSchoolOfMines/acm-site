const express = require('express');
const router = express.Router();
const pool = require('../app');
const db = require('../database/db');
// import * as db from '../db.js'

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
  let email = req.user.email;
  let name = req.user.full;

  if(req.body.name && req.body.email) {
    // user is submitting with form data
    email = req.body.email;
    name = req.body.name;
  }
  else {
    // something went very wrong if they submitted without data and aren't logged in
    req.flash('error', 'Something went wrong! Contact a site administrator about this.');
    res.redirect('/');
  }

  // Check if user has RSVP'ed already
  let rsvped = false;
  const rsvp = await db.query("SELECT 1 FROM rsvps WHERE email = $1", [req.user.email]);
  if(rsvp.rows.length > 0) {
    rsvped = true;
  }
  else {
    await db.query("INSERT INTO rsvps VALUES ($1, $2, $3)", [req.body.meetingId, name, email]);
  }
  
  if(rsvped) {
    req.flash('error', 'You have already RSVP\'ed for this event!');
    res.redirect('/');
  }
  else {
    req.flash('success', 'Successfully RSVP\'ed! Thanks for coming.');
    res.redirect('/');
  }
});

router.get('/attend', (req, res) => {
  res.render('attend', { title: 'Attend' });
});

router.post('/attend', async(req, res) => {
  // If user is logged in, use those credentials instead
  let email;
  if(req.user) {
    console.log(req.user.email)

    email = req.user.email;
  }
  else {
    console.log(req.body)

    email = req.body.email;
  }

  // check if submitted already
  
  // POST form data to attendance table
  // console.log(req.body.meeting) // pass meeting through somehow

  // get active meeting
  let meetingId;

  let now = new Date();
  console.log(now.toISOString());

  const resp = await pool.query("SELECT id FROM meetings WHERE date >= NOW() and date <= NOW() + INTERVAL '1 hour'")
  // date >= NOW() AND date <= NOW() + INTERVAL '2 weeks'


  await pool.query("INSERT INTO attendance VALUES ('" + meetingId + "', '" + req.body.email + "') ON CONFLICT DO NOTHING");

  req.flash('success', 'Your attendance has been logged! Thanks for coming.')
  res.redirect('/');
})

module.exports = router;
