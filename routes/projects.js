const express = require('express');
const db = require('../database/db');
const fs = require('fs');
const uuid = require('uuid');
const { isAdminAuthenticated, upload, fallible } = require('../middleware');
const router = express.Router();

const parseBaseProjectForm = async (req) => {
  const project = {};
  if (typeof req.body.title === "string" && req.body.title.length > 0) {
    project.title = req.body.title;
  } else {
    throw new TypeError("Invalid project title");
  }

  if (typeof req.body.description === "string" && req.body.description.length > 0) {
    project.description = req.body.description;
  } else {
    throw new TypeError("Invalid project description");
  }

  if (typeof req.body.repository === "string" && req.body.repository.length > 0) {
    project.repository = req.body.repository;
  } else {
    throw new TypeError("Invalid project repository");
  }

  if (typeof req.body.website === "string") {
    // Website field is optional and will be undefined if not specified,
    // transform into an empty string is that's the case.
    if (req.body.website) {
      project.website = req.body.website;
    } else {
      project.website = "";
    }
  } else {
    throw new TypeError("Invalid project website");
  }

  const getAuthorValue = (i) => req.body[`author${i}`]
  project.authors = [];
  for (let i = 0; getAuthorValue(i); ++i) {
    const author = getAuthorValue(i);
    const authorResp = await db.query("SELECT FROM users WHERE id = $1", [author]);
    if (authorResp.rows.length == 0) {
      req.flash('error', `Author ${author} was not found!`);
      return;
    }
    project.authors.push(author);
  }

  if (project.authors.length < 1) {
    throw TypeError("Invalid project authors")
  }

  // Archived field will either be "on" if selected or undefined if not,
  // convert it to a boolean by those rules.
  project.archived = (req.body.archived !== undefined);

  if (req.file) {
    project.imageId = req.file.filename;
  }

  return project;  
}

const withProjectForm = (body) => 
  fallible(
    async (req, res) => {  
      const project = await parseBaseProjectForm(req);
      if (project) {
        await body(req, res, project);
      } else if (req.file) {
        fs.unlinkSync("uploads/", req.file.filename);
      }
      res.redirect('/projects')
    }
  )

router.get('/projects', fallible(async (req, res) => {
  const projectsResp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  for (let project of projectsResp.rows) {
    const authorsResp = await db.query("SELECT users.id, users.name, users.avatar_id " +
      "FROM users JOIN project_authors ON users.id = project_authors.author_id " +
      "JOIN projects ON project_authors.project_id = projects.id " +
      "WHERE projects.id = $1", [project.id]);
    project.authors = authorsResp.rows;
  }
  res.render('projects', { title: "Projects", projects: projectsResp.rows });
}));

router.post('/projects', isAdminAuthenticated, upload('image'), withProjectForm(async (req, res, project) => {
  project.id = uuid.v4();
  if (!project.imageId) {
    throw new TypeError("Invalid project image id");
  }

  await db.transaction(async (client) => {
    await client.query(
      "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [project.id, project.title, project.description, project.website, 
        project.repository, project.archived, project.imageId]);
    // Insert the author relations from the query. These were already validated to
    // be present in the users DB earlier, so they can be inserted directly.
    for (let author of project.authors) {
      await client.query(
        "INSERT INTO project_authors VALUES ($1, $2)", [project.id, author])
    }
  })

  req.flash('success', 'Successfully added project!');
}));

router.post('/projects/edit', isAdminAuthenticated, upload('image'), withProjectForm(async (req, res, project) => {
  if (!uuid.validate(req.body.project_id)) {
    throw new Error("Invalid project id")
  }
  project.id = req.body.project_id;

  // Image uploading is optional when editing projects, so we will need to determine whether we
  // need to remove an old image or retain the existing image. Either way, this requires us to
  // obtain the image ID from the database first.
  const imageResp = await db.query("SELECT image_id FROM projects WHERE id = $1", [project.id]);
  const imageId = imageResp.rows[0].image_id;
  if (project.imageId) {
    // New image is being applied, remove the old image.
    fs.unlinkSync("uploads/" + imageId);
  } else {
    // No change in image.
    project.imageId = imageId;
  }

  await db.transaction(async (client) => {
    await client.query(
      "UPDATE projects SET title = $1, description = $2, website = $3, repository = $4, archived = $5, image_id = $6 WHERE id = $7",
      [project.title, project.description, project.website, project.repository, project.archived, project.imageId, project.id])
    
    // Since the author amount could have changed in length, just wipe the prior relations
    // and insert ones to avoid stray entries.
    await client.query("DELETE FROM project_authors WHERE project_id = $1", [project.id]);
    for (let author of project.authors) {
      await client.query(
        "INSERT INTO project_authors VALUES ($1, $2)", [project.id, author])
    }
  });

  req.flash('success', 'Successfully edited project!');
}));

router.post('/projects/delete', isAdminAuthenticated, fallible(async (req, res) => {
  if (!uuid.validate(req.body.project_id)) {
    throw new Error("Invalid project id")
  }
  const projectId = req.body.project_id;
  
  // Free the space taken up by the now-unused image.
  const imageResp = await db.query("SELECT image_id FROM projects WHERE id = $1", [projectId]);
  fs.unlinkSync("uploads/" + imageResp.rows[0].image_id);

  await db.transaction(async (client) => {  
    await client.query("DELETE FROM project_authors WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM projects WHERE id = $1", [projectId]);
  });

  req.flash('success', 'Successfully deleted project!');
  res.redirect('/projects');
}));

module.exports = router;
