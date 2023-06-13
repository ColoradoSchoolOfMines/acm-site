require('dotenv').config();
const express = require('express');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const pg = require('pg');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { isLoggedIn, isAdminAuthenticated } = require('./middleware');
const app = express();
const pool = new pg.Pool({ connectionString: process.env.DB_URL });

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(flash());
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [ "'unsafe-inline'", "'self'", "https://discord.com/" ],
    scriptSrc: [ "'unsafe-inline'", "'self'", "https://cdn.jsdelivr.net" ],
  },
}));

app.use(session({
  store: new (require('connect-pg-simple')(session))({
    conString: process.env.DB_URL
  }),
  name: 'session',
  secret: process.env.COOKIE_SECRET || "change this!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (profile.email.endsWith("@mines.edu")) {
    // TODO run INSERT IGNORE INTO users
    // query; if user was generated already they don't need to be again
    user = {
      "first": profile.given_name,
      "last": profile.family_name,
      "full": profile.given_name + ' ' + profile.family_name,
      "email": profile.email,
      "isAdmin": false // false in prod, true for debugging right now
    }
    req.flash('success', 'Succesfully logged in!');
    done(null, user);
  }
  else {
    req.flash('error', 'Please log in with a valid mines.edu email!');
    done(null, false);
  }
}
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', keepSessionInfo: true }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

app.get('/', isLoggedIn, async (req, res) => {
  // TODO convert to DB query + randomize
  image = {
    url: "./static/images/acm2.jpeg",
    caption: "Some image caption here! 2023"
  }

  res.render('home', { title: 'Home', user: req.user, image: image });
});

app.get('/about', isLoggedIn, async (req, res) => {
  const resp = await pool.query("SELECT * FROM users WHERE is_officer = true;");
  res.render('about', { title: 'About Us', people: resp.rows, user: req.user });
});

app.get('/login', passport.authenticate('google', { scope: ['email', 'profile'] }), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    req.flash('success', 'Succesfully logged out.')
    res.redirect('/');
  });
});

app.get('/presentations', isLoggedIn, async (req, res) => {
  const resp = await pool.query("SELECT * FROM presentations");
  res.render('presentations', { title: 'Presentations', presentations: resp.rows, user: req.user });
});

app.get('/projects', isLoggedIn, async (req, res) => {
  const resp = await pool.query("SELECT * FROM projects");
  res.render('projects', { title: "Projects", projects: resp.rows, user: req.user });
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.first + ' ' + req.user.last, user: req.user });
});

app.get('/admin', isAdminAuthenticated, (req, res) => {
  res.render('admin', { title: 'Admin', user: req.user });
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404" });
});

app.use((err, req, res, next) => {
  res.status(500).send('Sorry - Something broke on our end!');
});

app.listen(process.env.PORT || 3000, async () => {
  const initQuery = fs.readFileSync('database/init_database.sql').toString();
  await pool.query(initQuery);
  console.log("ACM server started!");
});

// TODO potentially handle SIGTERM + exit
process.on('SIGINT', async () => {
  console.log("Shutting down..");
  await pool.end();
  process.exit(0);
});
