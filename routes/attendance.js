const express = require('express');
const router = express.Router();

router.get('/rsvp', (req, res) => {
  res.render('rsvp', { title: 'RSVP' });
});

router.get('/attend', (req, res) => {
  res.render('attend', { title: 'Attend' });
});

router.post('/attend', async(req, res) => {
  // If user is logged in, use those credentials
  if(req.user) {
    console.log("user is signed in")
  }
  else {
    console.log("using form data..")
  }

  // POST form data to attendance table
  console.log(req.body.name)
  console.log(req.body.email)
  // console.log(req.body.meeting) // pass meeting through somehow

  let meetingId;

  // await pool.query("INSERT INTO attendance VALUES ('" + meetingId + "', '"
  // + req.body.email + "') ON CONFLICT DO NOTHING");

  req.flash('success', 'Your attendance has been logged! Thanks for coming.')
  res.redirect('/');
})

module.exports = router;
