const express = require('express');
const db = require('../database/db');
const fs = require('fs');
const uuid = require('uuid');
const { isAdminAuthenticated, upload } = require('../middleware');
const router = express.Router();

// Methods to help parse project queries

const parseAuthors = async (req, res) => {
  const getAuthorValue = (i) => req.body[`author${i}`]
  req.body.authors = [];
  for (let i = 0; getAuthorValue(i); ++i) {
    const author = getAuthorValue(i);
    const resp = await db.query("SELECT FROM users WHERE id = $1", [author]);
    if (resp.rows.length == 0) {
      req.flash('error', 'Project authors must have created an account prior!');
      return false;
    }
    req.body.authors.push(author);
  }
  return true;
}

const transformProjectRequest = async (req, res, next) => {
  let response = await parseAuthors(req, res);
  if (!response) {
    // Multer needs to be ran first to parse the request, but that will also
    // lead to an upload sticking around even if an error occurs. Make sure
    // that this upload is removed.
    if (req.file) {
      fs.unlinkSync("uploads/" + req.file.filename);
    }
    res.redirect('/projects');
  }
  else {
    // Website field is optional and will be undefined if not specified,
    // transform into an empty string is that's the case.
    if (!req.body.website) {
      req.body.website = ""
    }
  
    // Archived field will either be "on" if selected or undefined if not,
    // convert it to a boolean by those rules.
    req.body.archived = (req.body.archived !== undefined);
    next();
  }
}

const clearProjectImage = async (req) => {
  // We don't have access to the image id from the request usually, query it from the db.
  const resp = await db.query("SELECT image_id FROM projects WHERE id = $1", [req.body.project_id]);
  fs.unlinkSync("uploads/" + resp.rows[0].image_id);
}

router.get('/projects', async (req, res) => {
  const projectResp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  for (let project of projectResp.rows) {
    const authorResp = await db.query("SELECT users.id, users.name, users.avatar_id " +
      "FROM users JOIN project_authors ON users.id = project_authors.author_id " +
      "JOIN projects ON project_authors.project_id = projects.id " +
      "WHERE projects.id = $1", [project.id]);
    project.authors = authorResp.rows;
  }
  res.render('projects', { title: "Projects", projects: projectResp.rows });
});

router.post('/projects', isAdminAuthenticated, upload('image'), transformProjectRequest, async (req, res) => {
  const id = uuid.v4();
  await db.query(
    "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, req.body.title, req.body.description, req.body.website, req.body.repository,
      req.body.archived, req.file.filename]);

  // Insert the author relations from the query. These were already validated to
  // be present in the users DB earlier, so they can be inserted directly.
  for (let i = 0; i < req.body.authors.length; ++i) {
    await db.query(
      "INSERT INTO project_authors VALUES ($1, $2)", [id, req.body.authors[i]])
  }

  req.flash('success', 'Successfully added project!');
  res.redirect('/projects');
});

router.post('/projects/edit', isAdminAuthenticated, upload('image', true), transformProjectRequest, async (req, res) => {
  // Image uploading is optional when editing projects, so we need to perform different queries
  // for the different states.
  if (req.file) {
    // Free the space taken up by the now-unused project image.
    await clearProjectImage(req);
    await db.query(
      "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5, image_id = $6 WHERE id = $7",
      [req.body.title, req.body.description, req.body.website, req.body.repository,
      req.body.archived, req.file.filename, req.body.project_id])
  } else {
    // No image specified, leave it unchanged and only commit the rest.
    await db.query(
      "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5 WHERE id = $6",
      [req.body.title, req.body.description, req.body.website, req.body.repository,
      req.body.archived, req.body.project_id])
  }

  // Since the author amount could have changed in length, just wipe the prior relations
  // and insert ones to avoid stray entries.
  await db.query("DELETE FROM project_authors WHERE project_id = $1", [req.body.project_id]);
  for (let i = 0; i < req.body.authors.length; ++i) {
    await db.query(
      "INSERT INTO project_authors VALUES ($1, $2)", [req.body.project_id, req.body.authors[i]])
  }

  req.flash('success', 'Successfully edited project!');
  res.redirect('/projects');
});

router.post('/projects/delete', isAdminAuthenticated, async (req, res) => {
  // Free the space taken up by the now-unused project image.
  await clearProjectImage(req);
  await db.query("DELETE FROM project_authors WHERE project_id = $1", [req.body.project_id]);
  await db.query("DELETE FROM projects WHERE id = $1", [req.body.project_id]);
  req.flash('success', 'Successfully deleted project!');
  res.redirect('/projects');
});

module.exports = router;
