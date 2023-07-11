const express = require('express');
const fs = require('fs');
const db = require('../database/db');
const { isLoggedIn, upload } = require('../middleware');
const router = express.Router();

router.get('/profile', isLoggedIn, async (req, res) => {
  const meetings_resp = await db.query("SELECT title, date FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE attendance.email = $1", [req.user.email]);
  const projects_resp = await db.query("SELECT title, repository FROM projects JOIN user_projects ON user_projects.project_id = projects.id WHERE user_projects.user_id = $1", [req.user.email]);
  res.render('profile', { title: req.user.name, meetings: meetings_resp.rows, projects: projects_resp.rows });
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
