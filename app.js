require('dotenv').config();
const express = require('express')
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const app = express()
const port = 3000

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static('public'))

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
      user = {
        "first": profile.given_name,
        "last": profile.family_name,
        "full": profile.given_name + ' ' + profile.family_name,
        "email": profile.email,
        "isAdmin": true // TODO check with admin registry file
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
  res.render('home', { title: 'Mines ACM', user: req.user });
});

// TODO Use SQL or JSON configs to store presentation officer etc data
const people = [
  {
    name: "Ethan Richards",
    role: "President, HSPC Chair",
    email: "erichards [at] mines [dot] edu",
    url: 'ethan.jpg'
  },
  {
    name: "Umberto Gherardi",
    role: "Vice President"
  },
  {
    name: "Tyler Wright",
    role: "Treasurer"
  },
  {
    name: "Brooke Bowcutt",
    role: "Director of Advertising"
  },
  {
    name: "Keenan Buckley",
    role: "Director of Project Meetings"
  },
  {
    name: "Eugin Pahk",
    role: "Advisor, Director of Tech Talks"
  },
  {
    name: "Jayden Pahukula",
    role: "Director of Special Events"
  },
  {
    name: "Finn Burns",
    role: "Director of DI&A"
  },
  {
    name: "Dorian Cauwe",
    role: "Advisor"
  },
]

app.get('/about', isLoggedIn, (req, res) => {
  res.render('about', { title: 'About Us | Mines ACM', people, user: req.user })
})

const presentations = [
  {
    name: "",
    author: "",
    date: ""
  }
]

app.get('/login', passport.authenticate('google', { scope: [ 'email', 'profile' ] }), (req, res) => {
  res.redirect('/');
});

app.get('/presentations', (req, res) => {
  res.render('presentations', { title: 'Presentations | Mines ACM', presentations })
})

app.get('/projects', (req, res) => {
  res.render('projects', { title: "Projects | Mines ACM"})
})

app.get('/profile', (req, res) => {
  res.render('profile')
})

app.get('/admim', (req, res) => {
  res.render('admin')
})

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404 | Mines ACM"});
})

// TODO check for error routes

app.listen(port, () => {
  console.log(`ACM listening on port ${port}`)
})
