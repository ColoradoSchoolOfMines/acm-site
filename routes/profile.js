const express = require('express');
const fs = require('fs/promises');
const db = require('../database/db');
const { isLoggedIn, upload, fallible } = require('../middleware');
const router = express.Router();

router.get('/profile/:id', fallible(async (req, res) => {
  const userResp = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  const targetUser = userResp.rows[0];
  
  if (targetUser) {
    const meetingsResp = await db.query(
      "SELECT title, date FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE attendance.user_id = $1", 
      [targetUser.id]);

    const projectsResp = await db.query(
      "SELECT title, repository FROM projects JOIN project_authors ON project_authors.project_id = projects.id WHERE project_authors.author_id = $1",
      [targetUser.id]);

    const isUser = req.user && targetUser.id == req.user.id;
    res.render('profile', { 
      title: targetUser.name, profileUser: targetUser, isProfileUser: isUser, 
      meetings: meetingsResp.rows, projects: projectsResp.rows });
  } else {
    res.status(404).render('404', { title: '404' });
  }
}));

router.post('/profile/avatar', isLoggedIn, upload('avatar'), fallible(async (req, res) => {
  if (!req.file) {
    throw new TypeError("Invalid user avatar");
  }
  const avatarId = req.file.filename;

  if (req.user.avatar_id) {
    // Free the space taken up by the now-unused profile picture
    await fs.unlink("uploads/" + req.user.avatar_id);
  }
  await db.query("UPDATE users SET avatar_id = $1 WHERE id = $2", [avatarId, req.user.id]);

  req.flash('success', 'Profile picture uploaded successfully!');
  res.redirect('/profile/' + req.user.id);
}));

router.post('/profile/about', isLoggedIn, fallible(async (req, res) => {
  if (!req.body.about) {
    throw new TypeError("Invalid user about")
  }
  const about = req.body.about;

  await db.query("UPDATE users SET about = $1 WHERE id = $2", [about, req.user.id]);
  req.flash('success', 'Biography updated successfully!');
  res.redirect('/profile/' + req.user.id);
}));

module.exports = router;
