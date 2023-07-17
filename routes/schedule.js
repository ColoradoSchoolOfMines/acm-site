const express = require('express');
const db = require('../database/db');
const ical = require('ical-generator');
const router = express.Router();

router.get('/schedule', async (req, res) => {
  let upcoming = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '3 weeks' ORDER BY date");
  for (let meeting in upcoming.rows) {
    if (req.user) {
      const rsvp = await db.query("SELECT * FROM rsvps WHERE id = $1 AND meeting = $2", [req.user.id, upcoming.rows[meeting].id]);
      if (rsvp.rows.length > 0) {
        upcoming.rows[meeting].rsvped = true;
      }
    }
    else {
      upcoming.rows[meeting].rsvped = false;
    }
  }

  let previous = await db.query("SELECT * FROM meetings WHERE date <= NOW() ORDER BY date DESC");
  res.render('schedule', { title: 'Schedule', upcoming: upcoming.rows, previous: previous.rows });
});

router.get('/schedule/ical.ics', async (req, res) => {
  const resp = await db.query("SELECT * FROM meetings");

  const calendar = ical.default({ 
    name: 'Mines ACM',
    description: "All of the talks\\, open source meetings\\, and other activities of the Mines ACM Student Chapter.",
    prodId: {
      company: 'Mines ACM',
      product: 'web',
      language: 'EN'
    }
  });

  for (let meeting of resp.rows) {
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
});

module.exports = router;