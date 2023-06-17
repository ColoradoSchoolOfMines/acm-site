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
  if (req.user == undefined || !req.user.isAdmin || !req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.user = false;
    req.flash('error', 'You do not have permission to view this page!');
    return res.redirect('/');
  }
  else {
    next();
  }
}
