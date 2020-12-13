// Dependencies
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const uid = require('uid-safe')

// Inititalize App
const app = express()

// Static files
app.use(express.static('public'))

// Session management
const sessionConfig = {
  secret: uid.sync(18),
  resave: false,
  saveUninitialized: true
}
app.use(session(sessionConfig))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })) 
// parse application/json
app.use(bodyParser.json())

// Set view engine: EJS
app.set('view engine', 'ejs')

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NodeRecipes', { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('connected to database'))

// Import Base Routes
const routes = require('./routes')
app.use('/', routes)

// Import API Routes
const api = require('./api')
app.use('/api', api)

// Render 404 view if no route before this was defined
app.get('*', (req, res) => {
  return res.render('404.ejs', { type: 'Page', loggedIn: req.session.currentUser })
})

// Start server
app.listen(8000, () => {
  console.log('Server running on port 8000...')
})
