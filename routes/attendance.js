const express = require('express');
const { isLoggedIn } = require('../middleware');
const router = express.Router();

router.get('/rsvp', (req, res) => {
  res.render('rsvp', { title: 'RSVP' });
});

router.get('/attend', (req, res) => {
  res.render('attend', { title: 'Attend' });
});

// TODO check if user is logged in already and use that
router.post('/attend', (req, res) => {
  // POST form data to attendance table
  console.log(req.body.name)
  console.log(req.body.email)

  req.flash('success', 'Your attendance has been logged! Thanks for coming.')
  res.redirect('/');
})

module.exports = router;
