const express = require('express');
const multer = require('multer');
const fs = require('fs');
const db = require('../database/db');
const { isLoggedIn, upload } = require('../middleware')
const router = express.Router();

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.first + ' ' + req.user.last });
});

router.post('/profile', isLoggedIn, async (req, res) => {
  const uploadAvatar = upload.single('avatar');
  uploadAvatar(req, res, async(err) => {
    if (err instanceof multer.MulterError) {
      req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
    } else if (err) {
      req.flash('error', 'An error occurred while trying to upload your image! Please try again. If the issue persists, contact us.');
    } else {
      await db.query("UPDATE users SET avatar_id = '" + req.file.filename + "' WHERE email = '" + req.user.email + "'");
      fs.unlinkSync("uploads/" + req.user.avatarId);
      req.user.avatarId = req.file.filename;
      req.flash('success', 'Profile picture uploaded successfully!');
    }
    res.redirect('/profile');
  });
});

module.exports = router;