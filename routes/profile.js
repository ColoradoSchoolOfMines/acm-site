const express = require('express');
const fs = require('fs');
const db = require('../database/db');
const { isLoggedIn, upload } = require('../middleware');
const router = express.Router();

router.get('/profile/:id', async (req, res) => {
  const targetEmail = req.params.id;
  const resp = await db.query("SELECT * FROM users WHERE id = $1", [targetEmail]);
  
  if(resp.rows.length > 0) {
    const meetingsResp = await db.query("SELECT title, date FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE attendance.email = $1", [targetEmail]);
    const projectsResp = await db.query("SELECT title, repository FROM projects JOIN project_authors ON project_authors.project_id = projects.id WHERE project_authors.author_email = $1", [targetEmail]);
    const isUser = req.user ? (targetEmail == req.user.id) : false;
    res.render('profile', { title: resp.rows[0].name, profileUser: resp.rows[0], isProfileUser: isUser, meetings: meetingsResp.rows, projects: projectsResp.rows });
  }
  else {
    res.status(404).render('404', { title: '404' });
  }
});

router.post('/profile', isLoggedIn, upload('avatar'), async (req, res) => {
  await db.query("UPDATE users SET avatar_id = $1 WHERE id = $2", [req.file.filename, req.user.id]);
  if (req.user.avatar_id) {
    // Free the space taken up by the now-unused profile picture
    fs.unlinkSync("uploads/" + req.user.avatar_id);
  }
  req.flash('success', 'Profile picture uploaded successfully!');
  res.redirect('/profile/' + req.user.id);
});

router.post('/profile/about', isLoggedIn, async (req, res) => {
  req.user.about = req.body.about;
  await db.query("UPDATE users SET about = $1 WHERE id = $2", [req.body.about, req.user.id]);
  req.flash('success', 'Biography updated successfully!');
  res.redirect('/profile/' + req.user.id);
});

module.exports = router;
