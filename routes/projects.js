const express = require('express');
const multer = require('multer');
const db = require('../database/db');
const { upload } = require('../middleware')
const router = express.Router();

router.get('/projects', async (req, res) => {
  const resp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  res.render('projects', { title: "Projects", projects: resp.rows });
});

router.post('/projects', async (req, res) => {
  const uploadImage = upload.single('image');
  uploadImage(req, res, async(err) => {
    if (err instanceof multer.MulterError) {
      req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
    } else if (err) {
      req.flash('error', 'An error occurred while trying to upload your image! Please try again. If the issue persists, contact us.');
    } else {
      await db.query("INSERT INTO projects VALUES ('" + 
          uuid.v4() + "', '" +
          req.body.title + "', '" + 
          req.body.description + "', '" +
          req.body.website + "', '" +
          req.body.repository + "', '" +
          (req.body.archived !== undefined).toString() + "', '" +
          req.file.filename + "')");
      req.flash('success', 'Successfully added project!');
    }
    res.redirect('/projects');
  });
});

module.exports = router