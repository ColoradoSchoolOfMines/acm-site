const express = require('express');
const router = express.Router();
const pool = require('../app');
// import * as db from '../db.js'
const db = require('../database/index')
 
router.get('/rsvp', async(req, res) => {
  // Check if user has RSVP'ed already

  // TODO implement this in the DB


  // Find meeting and show it to user
  const resp = await db.query("SELECT * FROM meetings WHERE id = $1", [req.query.meeting]);
  res.render('rsvp', { title: 'RSVP', meeting: resp.rows[0] });
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
  
  // POST form data to attendance table
  // console.log(req.body.meeting) // pass meeting through somehow

  let meetingId;

  await pool.query("INSERT INTO attendance VALUES ('" + meetingId + "', '" + req.body.email + "') ON CONFLICT DO NOTHING");

  req.flash('success', 'Your attendance has been logged! Thanks for coming.')
  res.redirect('/');
})

module.exports = router;
