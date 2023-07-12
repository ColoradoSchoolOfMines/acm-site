const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.get('/presentations', async (req, res) => {
  const resp = await db.query("SELECT * FROM presentations");
  for (presentation of resp.rows) {
    // Just cleave off the time value randomly added for no reason
    // by JS Date, not bringing in Moment.js for just this.
    presentation.date = presentation.date.toISOString().split("T")[0];
  }
  res.render('presentations', { title: 'Presentations', presentations: resp.rows });
});

module.exports = router;
