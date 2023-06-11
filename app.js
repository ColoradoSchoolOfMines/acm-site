require('dotenv').config();
const express = require('express')
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const pg = require('pg');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const app = express();
const port = 3000

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static('public'))

const client = new pg.Client({ connectionString: process.env.DB_URL });

const sessionConfig = {
  name: 'session',
  secret: 'yeehaw',
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      // secure: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// TODO enable debug mode?
// if(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {

// }

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
  }, (request, accessToken, refreshToken, profile, done) => {
    if(profile.email.endsWith("@mines.edu")) {
      // TODO run INSERT IGNORE INTO users
      // query; if user was generated already they don't need to be again
      user = {
        "first": profile.given_name,
        "last": profile.family_name,
        "full": profile.given_name + ' ' + profile.family_name,
        "email": profile.email,
        "isAdmin": false // false in prod, true for debugging right now
      }
      request.flash('success', 'Succesfully logged in!')
      done(null, user);
    }
    else {
      request.flash('error', 'Please log in with a valid mines.edu email!')
      done(null, false)
    }
  }
));

isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
      req.session.returnTo = req.originalUrl;
      req.user = false;
  }
  next();
}

isAdminAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && !req.user.isAdmin) {
      req.session.returnTo = req.originalUrl;
      req.user = false;
      req.flash('error', 'You do not have permission to view this page!')
      res.redirect('/')
  }
  else {
    next();
  }
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(function(req,res,next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', keepSessionInfo: true }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

app.get('/', isLoggedIn, async(req, res) => {
  // TODO convert to DB query + randomize
  image = {
    url: "./static/images/acm2.jpeg",
    caption: "Some image caption here! 2023"
  }

  res.render('home', { title: 'Home', user: req.user });
});

app.get('/about', isLoggedIn, async(req, res) => {
  const resp = await client.query("SELECT * FROM users WHERE is_officer = true;");
  res.render('about', { title: 'About Us', people: resp.rows, user: req.user })
})

app.get('/login', passport.authenticate('google', { scope: [ 'email', 'profile' ] }), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    req.flash('success', 'Succesfully logged out.')
    res.redirect('/');
  });
});

app.get('/presentations', async(req, res) => {
  const resp = await client.query("SELECT * FROM presentations");
  res.render('presentations', { title: 'Presentations', presentations: resp.rows, user: req.user })
})

app.get('/projects', async(req, res) => {
  const resp = await client.query("SELECT * FROM projects");
  res.render('projects', { title: "Projects", projects: resp.rows, user: req.user })
})

app.get('/profile', (req, res) => {
  res.render('profile')
})

app.get('/admin', isAdminAuthenticated, (req, res) => {
  res.render('admin', { title: 'Admin', user: req.user })
})

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404" });
})

// TODO check for error routes

app.listen(port, async() => {
  await client.connect()
  client.on('error', (err) => {
    console.error('The database encountered an error:', err.stack)
  })

  const initQuery = fs.readFileSync('database/init_database.sql').toString();
  await client.query(initQuery);

  console.log(`ACM listening on port ${port}`)
})

// TODO find a way to safely end PSQL client connection
// await client.end();
