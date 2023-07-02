const express = require('express');
const fs = require('fs');
const db = require('../database/db');
const { isLoggedIn, upload } = require('../middleware')
const router = express.Router();

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.name });
});

router.post('/profile', isLoggedIn, upload('avatar'), async (req, res) => {
    await db.query("UPDATE users SET avatar_id = $1 WHERE email = $2", [req.file.filename, req.user.email]);
    if (req.user.avatar_id) {
      // Free the space taken up by the now-unused profile picture
      fs.unlinkSync("uploads/" + req.user.avatar_id);
    }
    req.user.avatar_id = req.file.filename;
    req.flash('success', 'Profile picture uploaded successfully!');
    res.redirect('/profile');
});

module.exports = router;
