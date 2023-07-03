const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.get('/presentations', async (req, res) => {
  const resp = await db.query("SELECT * FROM presentations");
  res.render('presentations', { title: 'Presentations', presentations: resp.rows });
});

module.exports = router;
