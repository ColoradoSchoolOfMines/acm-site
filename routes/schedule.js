const express = require('express');
const db = require('../database/db');
const ical = require('ical-generator');
const { fallible } = require('../middleware');
const router = express.Router();

router.get('/schedule', fallible(async (req, res) => {
  let upcomingResp = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '3 weeks' ORDER BY date");
  for (let meeting of upcomingResp.rows) {
    if (req.user) {
      const rsvpResp = await db.query("SELECT * FROM rsvps WHERE user_id = $1 AND meeting = $2", [req.user.id, meeting.id]);
      meeting.rsvped = rsvpResp.rows.length > 0;
    } else {
      meeting.rsvped = false;
    }
  }

  let previousResp = await db.query("SELECT * FROM meetings WHERE date <= NOW() ORDER BY date DESC");
  res.render('schedule', { title: 'Schedule', upcoming: upcomingResp.rows, previous: previousResp.rows });
}));

router.get('/schedule/ical.ics', fallible(async (req, res) => {
  const meetingsResp = await db.query("SELECT * FROM meetings");

  const calendar = ical.default({ 
    name: 'Mines ACM',
    description: "All of the talks\\, open source meetings\\, and other activities of the Mines ACM Student Chapter.",
    prodId: {
      company: 'Mines ACM',
      product: 'web',
      language: 'EN'
    }
  });

  for (let meeting of meetingsResp.rows) {
    calendar.createEvent({
      id: meeting.id,
      summary: meeting.title,
      description: meeting.description,
      location: meeting.location,
      start: meeting.date,
      timezone: 'America/Denver',
      end: new Date(meeting.date.getTime() + meeting.duration)
    })
  }

  calendar.serve(res);
}));

module.exports = router;