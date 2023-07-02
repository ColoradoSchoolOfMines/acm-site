const express = require('express');
const db = require('../database/db');
const { upload } = require('../middleware')
const router = express.Router();

router.get('/projects', async (req, res) => {
  const resp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  res.render('projects', { title: "Projects", projects: resp.rows });
});

router.post('/projects', isAdminAuthenticated, upload('image'), async (req, res) => {
  await db.query(
    "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [uuid.v4(), req.body.title, req.body.description, req.body.website, req.body.repository, 
      (req.body.archived !== undefined).toString(), req.file.filename]);
  req.flash('success', 'Successfully added project!');
  res.redirect('/projects');
});

module.exports = router;
