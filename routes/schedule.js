const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.get('/schedule', async (req, res) => {
  let upcoming = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '3 weeks' ORDER BY date");
  for (let meeting in upcoming.rows) {
    if (req.user) {
      const rsvp = await db.query("SELECT * FROM rsvps WHERE email = $1 AND meeting = $2", [req.user.email, upcoming.rows[meeting].id]);
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

module.exports = router;