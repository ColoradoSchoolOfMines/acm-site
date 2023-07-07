const express = require('express');
const db = require('../database/db');
const fs = require('fs');
const uuid = require('uuid');
const { isAdminAuthenticated, upload } = require('../middleware');
const router = express.Router();

const getDBArchivedValue = (req) => (req.body.archived !== undefined).toString()

const clearProjectImage = async (req) => {
  // We don't have access to the image id from the request usually, query it from the db.
  let resp = await db.query("SELECT image_id FROM projects WHERE id = $1", [req.body.id]);
  fs.unlinkSync("uploads/" + resp.rows[0].image_id);
}

router.get('/projects', async (req, res) => {
  const resp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  res.render('projects', { title: "Projects", projects: resp.rows });
});

router.post('/projects', isAdminAuthenticated, upload('image'), async (req, res) => {
  await db.query(
    "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [uuid.v4(), req.body.title, req.body.description, req.body.website, req.body.repository, 
      getDBArchivedValue(req), req.file.filename]);
  req.flash('success', 'Successfully added project!');
  res.redirect('/projects');
});

router.post('/projects/edit', isAdminAuthenticated, upload('image', true), async (req, res) => {
  // Image uploading is optional when editing projects, so we need to perform different queries
  // for the different states.
  if (req.file) {
      // Free the space taken up by the now-unused project image.
      await clearProjectImage(req);
      await db.query(
        "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5, image_id = $6 WHERE id = $7",
        [req.body.title, req.body.description, req.body.website, req.body.repository, 
          getDBArchivedValue(req), req.file.filename, req.body.id])
  } else {
    // No image specified, leave it unchanged and only commit the rest.
    await db.query(
      "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5 WHERE id = $6",
      [req.body.title, req.body.description, req.body.website, req.body.repository, 
        getDBArchivedValue(req), req.body.id])
  }
  req.flash('success', 'Successfully updated project!');
  res.redirect('/projects');
});

router.post('/projects/delete', isAdminAuthenticated, async (req, res) => {
  // Free the space taken up by the now-unused project image.
  await clearProjectImage(req);
  await db.query("DELETE FROM projects WHERE id = $1", [req.body.id]);
  req.flash('success', 'Successfully deleted project!');
  res.redirect('/projects');
});

module.exports = router;
