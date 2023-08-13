const multer = require('multer');
const { multerConfig } = require('./config/general.config');
const upload = multer(multerConfig);
const fs = require('fs');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.user = false;
    req.flash('error', 'You must be logged in to view this page!');
    return res.redirect('/');
  }
  else {
    next();
  }
}

module.exports.isAdminAuthenticated = (req, res, next) => {
  if (req.user == undefined || !req.user.is_admin || !req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.user = false;
    req.flash('error', 'You do not have permission to view this page!');
    return res.redirect('/');
  }
  else {
    next();
  }
}

module.exports.upload = (id) => {
  const impl = upload.single(id);
  return async (req, res, next) => {
    impl(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
        res.redirect(req.url);
      } else if (err) {
        req.flash('error', 'An error occurred while trying to upload your image! Please try again. If the issue persists, contact us.');
        res.redirect(req.url);
      } else {
        next();
      }
    });
  }
}

module.exports.fallible = (block) => {
  return async (req, res, next) => {
    try {
      await block(req, res);
    } catch (e) {
      // If any upload middleware was used, we will need to remove the
      // newly-uploaded image as it's unlikely to be referenced anywhere
      // in the database.
      if (req.file) {
        try {
          fs.unlinkSync("uploads/" + req.file.filename)
        } catch (e) {
          // Letting this error be thrown would crash the server, and
          // routing it to next would override the original error we
          // wanted to catch and make debugging more difficult. Thus,
          // we ignore the error.
        }
      }
      next(e);
    }
  }
}