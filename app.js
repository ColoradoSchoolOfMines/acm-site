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
const { cspConfig, multerConfig, sessionConfig } = require('./config/general.config');
const { isLoggedIn, isAdminAuthenticated } = require('./middleware');
const upload = multer(multerConfig);
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const attendRoutes = require('./routes/attendance');
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
    await db.query("INSERT INTO users VALUES ('" + profile.email + "', '"
      + profile.given_name + "', '"
      + profile.family_name + "', '', '') ON CONFLICT DO NOTHING");

    // get user by email
    const resp = await db.query("SELECT * FROM users WHERE email = '" + profile.email + "'")
    user = {
      "first": resp.rows[0].first_name,
      "last": resp.rows[0].last_name,
      "full": resp.rows[0].first_name + ' ' + resp.rows[0].last_name,
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
})

app.use('/', authRoutes);
app.use('/', attendRoutes);

app.get('/', async (req, res) => {
  const resp = await db.query("SELECT * FROM images ORDER BY RANDOM() LIMIT 1");
  let image = resp.rows[0];

  let meetings = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date DESC LIMIT 2");
  for(let meeting in meetings.rows) {
    meetings.rows[meeting].date = formatDate(meetings.rows[meeting].date);
  }
  res.render('home', { title: 'Home', image: image, meetings: meetings.rows });
});

// TODO figure out where all this is needed or if there's a better way
formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric'
    // timeStyle: 'short'
  });
}

app.get('/about', async (req, res) => {
  const resp = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('about', { title: 'About Us', people: resp.rows });
});

app.get('/schedule', async(req, res) => {
  const upcoming = await db.query("SELECT * FROM meetings WHERE date >= NOW() AND date <= NOW() + INTERVAL '2 weeks' ORDER BY date LIMIT 2");
  const previous = await db.query("SELECT * FROM meetings WHERE date <= NOW() ORDER BY date DESC");
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

app.post('/projects', upload.single('image'), async (req, res) => {  
  if (req.file) {
    await db.query("INSERT INTO projects VALUES ('" + 
        uuid.v4() + "', '" +
        req.body.title + "', '" + 
        req.body.description + "', '" +
        req.body.website + "', '" +
        req.body.repository + "', '" +
        (req.body.archived !== undefined).toString() + "', '" +
        req.file.filename + "')");
    req.flash('success', 'Successfully added project!');
  } else {
    req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
  }
  res.redirect('projects');
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.first + ' ' + req.user.last });
});

app.post('/profile', isLoggedIn, upload.single('avatar'), async (req, res) => {
  if (req.file) {
    const resp = await db.query("UPDATE users SET avatar_id = '" + req.file.filename + "' WHERE email = '" + req.user.email + "'");
    fs.unlinkSync("uploads/" + req.user.avatarId);
    req.user.avatarId = req.file.filename;
    req.flash('success', 'Profile picture uploaded successfully!');
  } else {
    req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
  }
  res.redirect('/profile');
});

app.get('/admin', isAdminAuthenticated, async(req, res) => {
  let meetings = await db.query("SELECT * FROM meetings ORDER BY date");  
  for(let meeting in meetings.rows) {
    const attendance = await db.query("SELECT attendance.user FROM meetings JOIN attendance ON meetings.id = attendance.meeting WHERE meetings.id = $1", [meetings.rows[meeting].id])
    meetings.rows[meeting].attendance = attendance.rows;
  }

  const officers = await db.query("SELECT * FROM users WHERE title != ''");
  res.render('admin', { title: 'Admin', meetings: meetings.rows, officers: officers.rows });
});

app.post('/meetings', isAdminAuthenticated, async(req, res) => {

  // TODO figure out how to better handle meeting durations

  await db.query("INSERT INTO meetings VALUES ('" + 
      uuid.v4() + "', '" +
      req.body.title + "', '" + 
      req.body.description + "', '" +
      req.body.date + "', '" +
      req.body.duration + "', '" +
      req.body.location + "', '" +
      req.body.type + "')")

  res.redirect('/admin');
});

app.post('/admin', isAdminAuthenticated, upload.single('image'), async (req, res) => {
  if (req.file) {
    await db.query("INSERT INTO images VALUES ('" + req.file.filename + "', '" + req.body.caption + "')");
    res.redirect('/admin');
  } else {
    req.flash('error', 'Please upload a valid image. Only JPEG, JPG, and PNG files are allowed, and they must be under 5MB.');
  }
});

app.get('/uploads/:id', (req, res) => {
  let image = fs.readFileSync("uploads/" + req.params.id);
  // TODO: Actually give a correct mime type
  res.contentType('image/jpeg');
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
