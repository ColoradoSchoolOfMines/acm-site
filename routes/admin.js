const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAdminAuthenticated, upload } = require('../middleware');
const { formatDate, formatDuration } = require('../util.js');
const uuid = require('uuid');

router.get('/admin', isAdminAuthenticated, async(req, res) => {
  let meetings = await db.query("SELECT * FROM meetings ORDER BY date");  
  for(let meeting in meetings.rows) {
    const attendance = await db.query("SELECT attendance.email FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE meetings.id = $1", [meetings.rows[meeting].id])
    meetings.rows[meeting].attendance = attendance.rows;
    
    const originalDate = meetings.rows[meeting].date;
    meetings.rows[meeting].date = formatDate(originalDate);    
    meetings.rows[meeting].duration = formatDuration(originalDate, meetings.rows[meeting].duration);
  }

  const officers = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('admin', { title: 'Admin', meetings: meetings.rows, officers: officers.rows });
});

router.post('/admin', isAdminAuthenticated, upload('image'), async (req, res) => {
  await db.query("INSERT INTO images VALUES ($1, $2)", [req.file.filename, req.body.caption]);
  req.flash('success', 'Successfully uploaded image!');
  res.redirect('/admin');
});

router.post('/officers', isAdminAuthenticated, async (req, res) => {
  await db.query("UPDATE users SET title = $1 WHERE email = $2", [req.body.title, req.body.email]);
  req.flash('success', 'Successfully added officer role for ' + req.body.email + '.');
  res.redirect('/admin');
});

router.post('/officers/edit', isAdminAuthenticated, async (req, res) => {
  await db.query("UPDATE users SET title = $1 WHERE email = $2", [req.body.title, req.body.email]);
  req.flash('success', 'Successfully edited officer ' + req.body.email + '.');
  res.redirect('/admin');
});

router.post('/officers/remove', isAdminAuthenticated, async (req, res) => {
  await db.query("UPDATE users SET title = $1 WHERE email = $2", ['', req.body.email]);
  req.flash('success', 'Successfully removed ' + req.body.email + ' as an officer.');
  res.redirect('/admin');
});

router.post('/meetings', isAdminAuthenticated, async(req, res) => {
  await db.query("INSERT INTO meetings VALUES ($1, $2, $3, $4, $5, $6, $7)", [
      uuid.v4(), req.body.title, req.body.description, req.body.date,
      // convert hours -> milliseconds
      (req.body.duration * 3600000), req.body.location, req.body.type]);
  res.redirect('/admin');
});

module.exports = router;
