const passport = require('passport');
const express = require('express');
const router = express.Router();
const { fallible } = require('../middleware')

router.get('/login', passport.authenticate('google', { scope: ['email', 'profile'] }), fallible(async (req, res) => {
  res.redirect('/');
}));

router.get('/logout', fallible(async (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash('error', 'Could not successfully log out! Please contact a site administrator.')
      res.redirect('/');
    }
    else {
      req.flash('success', 'Succesfully logged out.')
      res.redirect('/');
    }
  });
}));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', keepSessionInfo: true }), fallible(async (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
}));

module.exports = router;
