const express = require('express')
const ejsMate = require('ejs-mate');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const CustomStrategy = require('passport-custom').Strategy;
const axios = require('axios')
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
app.use(passport.initialize());
app.use(passport.session());

passport.use('mpapi', new CustomStrategy(
  async function(req, callback) {
    let userData = {};
    if(req.query['tkt'] != undefined) {
      await axios.post('https://mastergo.mines.edu/mpapi/fetch?tkt=' + req.query['tkt']).then(function(response) {
        // TODO this can probably be organized/added better
        userData['uid'] = response.data['uid'];
        userData['mail'] = response.data.attributes['mail'];
        userData['first'] = response.data.attributes['first'];
        userData['last'] = response.data.attributes['sn'];
        userData['full'] = response.data.attributes['gecos'];
      }).catch(function (error) {
        if(error.response.status == 500) {
          userData['uid'] = 'session expired'
        }
      });
    }

    console.log("got back:", userData)
    callback(null, userData);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(function(req,res,next){
  res.locals.currentUser = req.user;
  next();
})

app.get('/', passport.authenticate('mpapi', { failureRedirect: '/' }), async(req, res) => {
  if(req.user.uid == 'session expired') {
    console.log('REDIRECTING currentuser:', req.user)
    res.redirect('/')
  }
  else {
    if(req.isAuthenticated()) {
      res.render('home', { title: 'Mines ACM', user: req.user })
    }
    else {
      res.render('home', { title: 'Mines ACM' })
    }
  }
})

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

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us | Mines ACM', people, user: false })
})

const presentations = [
  {
    name: "",
    author: "",
    date: ""
  }
]

app.get('/login', (req, res) => {
  console.log("Came from:", req.url)


  res.redirect('https://mastergo.mines.edu/mpapi/sso?return=http://localhost:3000/')
})

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

app.listen(port, () => {
  console.log(`ACM listening on port ${port}`)
})
