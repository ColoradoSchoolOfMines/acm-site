require('dotenv').config();
const express = require('express');
const https = require('https');
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
const { fallible } = require('./middleware');
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
    user_id = profile.email.split("@")[0] // only store ID
    await db.query("INSERT INTO users VALUES ($1, $2, '', '', '') ON CONFLICT DO NOTHING", [user_id, profile.displayName]);
    user = { id: user_id };
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
  const userResp = await db.query("SELECT * FROM users WHERE id = $1", [user]);
  if (userResp.rows.length > 0) {
    let info = userResp.rows[0];
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

app.get('/', fallible(async (req, res) => {
  const imageResp = await db.query("SELECT * FROM images ORDER BY RANDOM() LIMIT 1");
  const image = imageResp.rows[0];

  let meetingsResp = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date DESC LIMIT 2");
  for (let meeting of meetingsResp.rows) {
    if (req.user) {
      const rsvpResp = await db.query("SELECT * FROM rsvps WHERE user_id = $1 AND meeting_id = $2", [req.user.id, meeting.id]);
      meeting.rsvped = rsvpResp.rows.length > 0;
    } else {
      meeting.rsvped = false;
    }
  }

  res.render('home', { title: 'Home', image: image, meetings: meetingsResp.rows });
}));

app.get('/about', fallible(async (req, res) => {
  const peopleResp = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('about', { title: 'About Us', people: peopleResp.rows });
}));

app.get('/uploads/:id', fallible(async (req, res) => {
  let path = "uploads/" + req.params.id;
  if (fs.existsSync(path)) {
    let image = fs.readFileSync(path);
    res.contentType('image/*');
    res.send(Buffer.from(image.toString('base64'), 'base64'));
  } else {
    res.status(404).render('404', { title: '404' });
  }
}));

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404" });
});

app.use((err, req, res, next) => {
  let error;
  if (process.env.NODE_ENV === "development") {
    // Possible security hazard if we expose the trace, so only display it
    // in development mode.
    error = err.stack;
  }

  res.status(500).render('error', { title: "Error", error: error });
});

let privateKey = fs.readFileSync(process.env.PRIVATE_KEY);
let certificate = fs.readFileSync(process.env.CERTIFICATE);

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(process.env.PORT || 3000, async () => {
  const initQuery = fs.readFileSync('database/init_database.sql').toString();
  await db.query(initQuery);
  console.log("ACM server started!");
});

process.on('SIGINT', async () => {
  console.log("Shutting down..");
  await db.end();
  process.exit(0);
});
