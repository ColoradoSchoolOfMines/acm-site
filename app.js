require('dotenv').config();
const express = require('express');
const ejsMate = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const passport = require('passport');
const multer = require('multer');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { cspConfig, sessionConfig } = require('./config/general.config');
const { isLoggedIn, upload } = require('./middleware');
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const attendRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const { formatDate, formatDuration } = require('./util.js');
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
    await db.query("INSERT INTO users VALUES ($1, $2, '', '') ON CONFLICT DO NOTHING", [profile.email, profile.displayName]);
    const resp = await db.query("SELECT * FROM users WHERE email = $1", [profile.email])
    user = {
      "name": resp.rows[0].name,
      "email": resp.rows[0].email,
      "title": resp.rows[0].title,
      "is_admin": resp.rows[0].title.length > 0,
      "avatar_id": resp.rows[0].avatar_id
    }
    req.flash('success', 'Successfully logged in!');
    done(null, user);
  }
  else {
    req.flash('error', 'Please log in with a valid mines.edu email!');
    done(null, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
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

app.use('/', authRoutes);
app.use('/', attendRoutes);
app.use('/', adminRoutes);

app.get('/', async (req, res) => {
  const resp = await db.query("SELECT * FROM images ORDER BY RANDOM() LIMIT 1");
  const image = resp.rows[0];

  let meetings = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date DESC LIMIT 2");
  for(let meeting in meetings.rows) {
    const originalDate = meetings.rows[meeting].date;
    meetings.rows[meeting].date = formatDate(originalDate);    
    meetings.rows[meeting].duration = formatDuration(originalDate, meetings.rows[meeting].duration);
  }
  res.render('home', { title: 'Home', image: image, meetings: meetings.rows });
});

app.get('/about', async (req, res) => {
  const resp = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('about', { title: 'About Us', people: resp.rows });
});

app.get('/schedule', async(req, res) => {
  let upcoming = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date LIMIT 2");
  for(let meeting in upcoming.rows) {
    const originalDate = upcoming.rows[meeting].date;
    upcoming.rows[meeting].date = formatDate(originalDate);    
    upcoming.rows[meeting].duration = formatDuration(originalDate, upcoming.rows[meeting].duration);
  }

  let previous = await db.query("SELECT * FROM meetings WHERE date <= NOW() ORDER BY date DESC");
  for(let meeting in previous.rows) {
    const originalDate = previous.rows[meeting].date;
    previous.rows[meeting].date = formatDate(originalDate);    
    previous.rows[meeting].duration = formatDuration(originalDate, previous.rows[meeting].duration);
  }

  res.render('schedule', { title: 'Schedule', upcoming: upcoming.rows, previous: previous.rows });
});

app.get('/presentations', async (req, res) => {
  const resp = await db.query("SELECT * FROM presentations");
  res.render('presentations', { title: 'Presentations', presentations: resp.rows });
});

app.get('/projects', async (req, res) => {
  const resp = await db.query("SELECT * FROM projects ORDER BY archived, title");
  res.render('projects', { title: "Projects", projects: resp.rows });
});

app.post('/projects', async (req, res) => {
  const uploadImage = upload.single('image');
  uploadImage(req, res, async(err) => {
    if (err instanceof multer.MulterError) {
      req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
    } else if (err) {
      req.flash('error', 'An error occurred while trying to upload your image! Please try again. If the issue persists, contact us.');
    } else {
      await db.query(
        "INSERT INTO projects VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [uuid.v4(), req.body.title, req.body.description, req.body.website, req.body.repository, 
          (req.body.archived !== undefined).toString(), req.file.filename]);
      req.flash('success', 'Successfully added project!');
    }
    res.redirect('/projects');
  });
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.name });
});

app.post('/profile', isLoggedIn, async (req, res) => {
  const uploadAvatar = upload.single('avatar');
  uploadAvatar(req, res, async(err) => {
    if (err instanceof multer.MulterError) {
      req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
    } else if (err) {
      req.flash('error', 'An error occurred while trying to upload your image! Please try again. If the issue persists, contact us.');
    } else {
      await db.query("UPDATE users SET avatar_id = $1 WHERE email = $2", [req.file.filename, req.user.email]);
      if (req.user.avatar_id) {
        // Free the space taken up by the now-unused profile picture
        fs.unlinkSync("uploads/" + req.user.avatar_id);
      }
      req.user.avatar_id = req.file.filename;
      req.flash('success', 'Profile picture uploaded successfully!');
    }
    res.redirect('/profile');
  });
});

app.get('/uploads/:id', (req, res) => {
  let image = fs.readFileSync("uploads/" + req.params.id);
  res.contentType('image/*');
  res.send(Buffer.from(image.toString('base64'), 'base64'));
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404" });
});

app.use((err, req, res, next) => {
  res.status(500).render('error', { title: "Error", error: err });
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
