require('dotenv').config();
const express = require('express');
const ejsMate = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { cspConfig, sessionConfig } = require('./config/general.config');
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const attendRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const projectsRoutes = require('./routes/projects');
const presentationsRoutes = require('./routes/presentations');
const scheduleRoutes = require('./routes/schedule');
const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(sessionConfig));
app.use(cookieParser());
app.use(helmet.contentSecurityPolicy(cspConfig));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  if (profile.email.endsWith("@mines.edu")) {
    email = profile.email.split("@")[0] // only store ID
    await db.query("INSERT INTO users VALUES ($1, $2, '', '', '') ON CONFLICT DO NOTHING", [email, profile.displayName]);
    user = { id: email };
    req.flash('success', 'Successfully logged in!');
    done(null, user);
  } else {
    req.flash('error', 'Please log in with a valid mines.edu email!');
    done(null, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (user, done) => {
  const resp = await db.query("SELECT * FROM users WHERE id = $1", [user]);
  if (resp.rows.length > 0) {
    let info = resp.rows[0];
    info.is_admin = info.title.length > 0;
    done(null, info);
  } else {
    done(null, false);
  }
});

app.use((req, res, next) => {
  res.locals.user = req.user;

  // all flash cookies should expire after an hour
  cookieSettings = { httpOnly: true, maxAge: 1000 * 3600 };

  req.flash = (type, message) => {
    res.cookie('flash', message, cookieSettings);
    res.cookie('flashType', type, cookieSettings);
    res.cookie('flashed', true, cookieSettings);
  }

  if (req.cookies.flashed === "true") {
    res.cookie('flash', '', cookieSettings);
    res.cookie('flashType', '', cookieSettings);
    res.cookie('flashed', false, cookieSettings);
    res.locals.flash = req.cookies.flash;
    res.locals.flashType = req.cookies.flashType;
  }
  else {
    res.locals.flash = null;
  }

  next();
});

app.use('/', adminRoutes);
app.use('/', attendRoutes);
app.use('/', authRoutes);
app.use('/', presentationsRoutes);
app.use('/', profileRoutes);
app.use('/', projectsRoutes);
app.use('/', scheduleRoutes);

app.get('/', async (req, res) => {
  const resp = await db.query("SELECT * FROM images ORDER BY RANDOM() LIMIT 1");
  const image = resp.rows[0];

  let meetings = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date DESC LIMIT 2");
  for (let meeting in meetings.rows) {
    if (req.user) {
      const rsvp = await db.query("SELECT * FROM rsvps WHERE user_id = $1 AND meeting = $2", [req.user.id, meetings.rows[meeting].id]);
      if (rsvp.rows.length > 0) {
        meetings.rows[meeting].rsvped = true;
      }
    }
    else {
      meetings.rows[meeting].rsvped = false;
    }
  }

  res.render('home', { title: 'Home', image: image, meetings: meetings.rows });
});

app.get('/about', async (req, res) => {
  const resp = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('about', { title: 'About Us', people: resp.rows });
});

app.get('/uploads/:id', (req, res) => {
  let path = "uploads/" + req.params.id;
  if (fs.existsSync(path)) {
    let image = fs.readFileSync(path);
    res.contentType('image/*');
    res.send(Buffer.from(image.toString('base64'), 'base64'));
  } else {
    res.status(404).render('404', { title: '404' });
  }
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404" });
});

app.use((err, req, res, next) => {
  res.status(500).render('error', { title: "Error" });
});

app.listen(process.env.PORT || 3000, async () => {
  const initQuery = fs.readFileSync('database/init_database.sql').toString();
  await db.query(initQuery);
  console.log("ACM server started!");
});

process.on('SIGINT', async () => {
  console.log("Shutting down..");
  await db.end();
  process.exit(0);
});
