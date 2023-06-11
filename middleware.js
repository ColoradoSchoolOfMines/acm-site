module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.user = false;
  }
  next();
}

module.exports.isAdminAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && !req.user.isAdmin) {
    req.session.returnTo = req.originalUrl;
    req.user = false;
    req.flash('error', 'You do not have permission to view this page!');
    res.redirect('/');
  }
  else {
    next();
  }
}
