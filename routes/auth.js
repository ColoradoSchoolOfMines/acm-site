const passport = require('passport');
const express = require('express');
const router = express.Router();

router.get('/login', passport.authenticate('google', { scope: ['email', 'profile'] }), (req, res) => {
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    req.flash('success', 'Succesfully logged out.')
    res.redirect('/');
  });
});

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', keepSessionInfo: true }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

module.exports = router;
