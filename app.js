const express = require('express')
const path = require('path');
const ejsMate = require('ejs-mate');
const app = express()
const port = 3000

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home', { title: 'Mines ACM' })
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
  res.render('about', { title: 'About Us | Mines ACM', people })
})

const presentations = [
  {
    name: "",
    author: "",
    date: ""
  }
]

app.get('/presentations', (req, res) => {
  res.render('presentations', { title: 'Presentations | Mines ACM', presentations })
})

app.get('/projects', (req, res) => {
  res.render('projects', { title: "Projects | Mines ACM"})
})

// app.get('/admim', (req, res) => {
//   res.render('admin')
// })

app.use((req, res, next) => {
  res.status(404).render('404', { title: "404 | Mines ACM"});
})

app.listen(port, () => {
  console.log(`ACM listening on port ${port}`)
})
