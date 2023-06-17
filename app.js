require('dotenv').config();
const express = require('express');
const ejsMate = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const pg = require('pg');
const uuid = require('uuid');
const passport = require('passport');
const multer = require('multer')
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { isLoggedIn, isAdminAuthenticated } = require('./middleware');
const app = express();
const pool = new pg.Pool({ connectionString: process.env.DB_URL });

const upload = multer({ dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const sessionConfig = {
  store: new (require('connect-pg-simple')(session))({
    conString: process.env.DB_URL,
    createTableIfMissing: true
  }),
  name: 'session',
  secret: process.env.COOKIE_SECRET || "change this!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // TODO path.join here too?
app.use(session(sessionConfig));
app.use(cookieParser());
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'unsafe-inline'", "'self'", "https://discord.com/"],
    scriptSrc: ["'unsafe-inline'", "'self'", "https://cdn.jsdelivr.net"],
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  if (profile.email.endsWith("@mines.edu")) {
    // update users if one doesn't exist
    await pool.query("INSERT INTO users VALUES ('" + profile.email + "', '"
      + profile.given_name + "', '"
      + profile.family_name + "', '', '" + uuid.v4() + "') ON CONFLICT DO NOTHING");

    // get user by email
    const resp = await pool.query("SELECT * FROM users WHERE email = '" + profile.email + "'")
    user = {
      "first": resp.rows[0].first_name,
      "last": resp.rows[0].last_name,
      "full": resp.rows[0].first_name + ' ' + resp.rows[0].last_name,
      "email": resp.rows[0].email,
      "title": resp.rows[0].title,
      "isAdmin": resp.rows[0].title.length > 0,
      "avatar_id": resp.rows[0].avatar_id
    }
    // req.flash('flashMessage', 'Succesfully logged in!'); // TODO change back to success and error msgs
    req.flash('success', 'Successfully logged in!');
    done(null, user);
  }
  else {
    req.flash('flashMessage', 'Please log in with a valid mines.edu email!');
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

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "uploads/")
//     },
//     filename: function (req, file, cb) {
//       cb(null, req.user.avatar_id)
//     }
//   }),
//   fileFilter: function (req, file, cb) {
//     const validFormats = ["image/png", "image/jpeg"]
//     return cb(null, validFormats.includes(file.mimetype))
//   },
//   limits: { fileSize: 1024 * 1024 * 5 }
// })

app.use((req, res, next) => {
  res.locals.user = req.user;

  req.flash = (type, message) => {
    res.cookie('flash', message);
    res.cookie('flashType', type);
    res.cookie('flashed', true);
  };

  if(req.cookies.flashed === "true") {
    res.cookie('flash', '');
    res.cookie('flashType', '');
    res.cookie('flashed', false);
    res.locals.flash = req.cookies.flash;
    res.locals.flashType = req.cookies.flashType;
  }
  else {
    res.locals.flash = null;
  }

  next();
})

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', keepSessionInfo: true }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

app.get('/', async (req, res) => {
  const resp = await pool.query("SELECT * FROM images ORDER BY RANDOM() LIMIT 1");
  if (resp.rows.length > 0) {
    image = {
      url: resp.rows[0].url,
      caption: resp.rows[0].caption
    }
  }
  else {
    image = {
      url: "default_acm.jpeg",
      caption: "ACM officers at the 2021 Celebration of Mines."
    }
  }
  res.render('home', { title: 'Home', image: image });
});

app.get('/about', isLoggedIn, async (req, res) => {
  const resp = await pool.query("SELECT * FROM users WHERE title != '';");
  res.render('about', { title: 'About Us', people: resp.rows });
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
  res.render('presentations', { title: 'Presentations', presentations: resp.rows });
});

app.get('/projects', isLoggedIn, async (req, res) => {
  const resp = await pool.query("SELECT * FROM projects");
  res.render('projects', { title: "Projects", projects: resp.rows });
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: req.user.first + ' ' + req.user.last });
});

app.post('/profile', isLoggedIn, upload.single('avatar'), async (req, res) => {
  if (req.file) {
    req.flash('success', 'File uploaded successfully!');
  } 
  else {
    req.flash('error', 'Failed to upload file.');
  }
  res.redirect('/profile');
})

app.get('/rsvp', isLoggedIn, (req, res) => {
  res.render('rsvp', { title: 'RSVP' });
});

app.get('/attend', isLoggedIn, (req, res) => {
  res.render('attend', { title: 'Attend' });
});

app.post('/attend', isLoggedIn, (req, res) => {
  // POST form data to attendance table
})

app.get('/admin', isAdminAuthenticated, (req, res) => {
  res.render('admin', { title: 'Admin' });
});

app.post('/admin', isAdminAuthenticated, upload.single('image'), async (req, res) => {
  await pool.query("INSERT INTO images VALUES ('" + req.file.filename + "', '" + req.body.caption + "', false)");
  res.redirect('/admin');
});

app.get('/uploads/:id', (req, res) => {
  let image = fs.readFileSync("uploads/" + req.params.id);
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
  await pool.query(initQuery);
  console.log("ACM server started!");
});

process.on('SIGINT', async () => {
  console.log("Shutting down..");
  await pool.end();
  process.exit(0);
});
