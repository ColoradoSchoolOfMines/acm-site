const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAdminAuthenticated, upload } = require('../middleware');
const uuid = require('uuid');

router.get('/admin', isAdminAuthenticated, async (req, res) => {
  let meetings = await db.query("SELECT * FROM meetings ORDER BY date");
  for (let meeting in meetings.rows) {
    const attendance = await db.query("SELECT attendance.user_id FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE meetings.id = $1", [meetings.rows[meeting].id])
    meetings.rows[meeting].attendance = attendance.rows;
  }

  const officers = await db.query("SELECT * FROM users WHERE title != ''");
  const feedback = await db.query("SELECT * FROM feedback");
  res.render('admin', { title: 'Admin', meetings: meetings.rows, officers: officers.rows, feedbackData: feedback.rows });
});

router.post('/admin', isAdminAuthenticated, upload('image'), async (req, res) => {
  await db.query("INSERT INTO images VALUES ($1, $2)", [req.file.filename, req.body.caption]);
  req.flash('success', 'Successfully uploaded image!');
  res.redirect('/admin');
});

router.post('/officers', isAdminAuthenticated, async (req, res) => {
  const resp = await db.query("SELECT 1 FROM users WHERE id = $1", [req.body.email]);
  if(resp.rows.length > 0) {
    await db.query("UPDATE users SET title = $1 WHERE id = $2", [req.body.title, req.body.email]);
    req.flash('success', 'Successfully set officer role to ' + req.body.title + ' for ' + req.body.email + '.');
    res.redirect('/admin');
  }
  else {
    req.flash('error', 'There is not a user with that email!');
    res.redirect('/admin');
  }
});

router.post('/officers/remove', isAdminAuthenticated, async (req, res) => {
  await db.query("UPDATE users SET title = $1 WHERE id = $2", ['', req.body.email]);
  req.flash('success', 'Successfully removed ' + req.body.email + ' as an officer.');
  res.redirect('/admin');
});

router.post('/feedback/remove', isAdminAuthenticated, async (req, res) => {
  await db.query("DELETE FROM feedback WHERE id = $1 and feedback = $2", [req.body.email, req.body.feedback]);
  req.flash('success', 'Successfully removed feedback from ' + req.body.email + '.');
  res.redirect('/admin');
});

router.post('/meetings', isAdminAuthenticated, async (req, res) => {
  await db.query("INSERT INTO meetings VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    uuid.v4(), req.body.title, req.body.description, req.body.date,
    // convert hours -> milliseconds
    (req.body.duration * 3600000), req.body.location, req.body.type]);
  res.redirect('/admin');
});

router.post('/meetings/edit', isAdminAuthenticated, async (req, res) => {
  await db.query("UPDATE meetings SET title = $1, description = $2, date = $3, duration = $4, location = $5, type = $6 WHERE id = $7", [
    req.body.title, req.body.description, req.body.date,
    // convert hours -> milliseconds
    (req.body.duration * 3600000), req.body.location, req.body.type, req.body.id]);
  res.redirect('/admin');
});

module.exports = router;
