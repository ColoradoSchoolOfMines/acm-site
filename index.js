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
  res.render('home')
})

app.get('/about', (req, res) => {
  res.render('about')
})

app.get('/presentations', (req, res) => {
  res.render('presentations')
})

app.get('/projects', (req, res) => {
  res.render('projects')
})

app.listen(port, () => {
  console.log(`ACM listening on port ${port}`)
})
