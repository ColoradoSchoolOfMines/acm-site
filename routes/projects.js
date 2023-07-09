const express = require('express');
const db = require('../database/db');
const fs = require('fs');
const uuid = require('uuid');
const { isAdminAuthenticated, upload } = require('../middleware');
const router = express.Router();

// Methods to help parse project queries

const getAuthors = (req) => {
  const getAuthorValue = (req, i) => req.body[`author${i}`]

  let emails = [];
  for (let i = 0; getAuthorValue(req, i); ++i) {
    const email = getAuthorValue(req, i);
    if (!email.endsWith("@mines.edu")) {
      return null;
    }
    emails.push(email);
  }

  return emails;
}

const getArchived = (req) => (req.body.archived !== undefined).toString()

const clearProjectImage = async (req) => {
  // We don't have access to the image id from the request usually, query it from the db.
  let resp = await db.query("SELECT image_id FROM projects WHERE id = $1", [req.body.id]);
  fs.unlinkSync("uploads/" + resp.rows[0].image_id);
}

router.get('/projects', async (req, res) => {
  const projectResp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  for (let project of projectResp.rows) {
    const authorResp = await db.query("SELECT users.email, users.name, users.avatar_id " + 
      "FROM users JOIN project_authors ON users.email = project_authors.author_email " + 
      "JOIN projects ON project_authors.project_id = projects.id " + 
      "WHERE projects.id = $1", [project.id]);
    project.authors = authorResp.rows;
  }
  res.render('projects', { title: "Projects", projects: projectResp.rows });
});

router.post('/projects', isAdminAuthenticated, upload('image'), async (req, res) => {
  // Must validate authors here to avoid partially writing projects
  let authors = getAuthors(req);
  if (authors) {
    let id = uuid.v4();
    await db.query(
      "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, req.body.title, req.body.description, req.body.website, req.body.repository, 
        getArchived(req), req.file.filename]);

    for (let author of authors) {
      await db.query(
        "INSERT INTO project_authors VALUES ($1, $2)", [id, project])
    } 

    req.flash('success', 'Successfully added project!');
  } else {
    req.flash('error', "Project authors can only have @mines.edu addresses!");
  }

  res.redirect('/projects');
});

router.post('/projects/edit', isAdminAuthenticated, upload('image', true), async (req, res) => {
  // Must validate here to avoid partially writing project edits even with invalid authors
  let authors = getAuthors(req);
  if (authors) {
    // Image uploading is optional when editing projects, so we need to perform different queries
    // for the different states.
    if (req.file) {
      // Free the space taken up by the now-unused project image.
      await clearProjectImage(req);
      await db.query(
        "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5, image_id = $6 WHERE id = $7",
        [req.body.title, req.body.description, req.body.website, req.body.repository, 
          getArchivedValue(req), req.file.filename, req.body.id])
    } else {
      // No image specified, leave it unchanged and only commit the rest.
      await db.query(
        "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5 WHERE id = $6",
        [req.body.title, req.body.description, req.body.website, req.body.repository, 
          getArchived(req), req.body.id])
    }

    await db.query("DELETE FROM project_authors WHERE project_id = $1", [req.body.id]);
    for (let author of authors) {
      await db.query(
        "INSERT INTO project_authors VALUES ($1, $2)", [req.body.id, author])
    } 

    req.flash('success', 'Successfully updated project!');
  } else {
    req.flash('error', "Project authors can only have @mines.edu addresses!");
  }

  res.redirect('/projects');
});

router.post('/projects/delete', isAdminAuthenticated, async (req, res) => {
  // Free the space taken up by the now-unused project image.
  await clearProjectImage(req);
  await db.query("DELETE FROM project_authors WHERE project_id = $1", [req.body.id]);
  await db.query("DELETE FROM projects WHERE id = $1", [req.body.id]);
  req.flash('success', 'Successfully deleted project!');
  res.redirect('/projects');
});

module.exports = router;
