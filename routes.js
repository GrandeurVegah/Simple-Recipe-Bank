router = require('express').Router()
const axios = require('axios')
const moment = require('moment')
const bcrypt = require('bcrypt')

// Mongoose Schemas
const User = require('./models/user-model')

// Check if session id for user is set
const checkIfAuthenticated = (req, res, next) => {
  if (req.session.currentUser) {
    return next()
  }
  return res.redirect('home.ejs')
}

// Check that session id for user is not set
const checkIfNotAuthenticated = (req, res, next) => {
  if (!req.session.currentUser) {
    return next()
  }
  return res.redirect('home.ejs')
}

// GET: Homepage
router.get('/', (req, res) => {
  res.render('homepage.ejs', { loggedIn: req.session.currentUser })
})

// GET: Login Page

router.get('/auth', checkIfNotAuthenticated, (req, res) => {
  res.render('auth-form.ejs', { data: {}, errors: [], register: false })
})

// GET: Register Page

router.get('/register', checkIfNotAuthenticated, (req, res) => {
  res.render('auth-form.ejs', { data: {}, errors: [], register: true })
})

// POST: Authentication

router.post('/auth', (req, res) => {
  if (req.body && req.body.type) {
    const errors = []
    // Validate username (required)
    if (!req.body.username) {
      errors.push({ field: 'username', message: 'Username is required.' })
    }
    // Validate password (required)
    if (!req.body.password) {
      errors.push({ field: 'password', message: 'Password is required.' })
    }

    // If errors found, re-render page to show error messages to the user
    if (errors.length > 0) return res.render('auth-form.ejs', { data: req.body, errors, register: (req.body.type === 'register') })

    // Login request
    if (req.body.type === 'login') {
      // MongoDB request for username
      User.findOne({ username: req.body.username }, (err, user) => {
        // MongoDB Error
        if (err) return res.status(502).json({ error: err })
        // Error: No User with that username exsists
        if (!user) return res.render('auth-form.ejs', { data: req.body, errors: [{ field: 'username', message: 'The username and password combination is not correct. Please check your username and password and try again.' }], register: false })

        // Validate if password matches the username / password combination
        bcrypt.compare(req.body.password, user.password).then(success => {
          // Success
          if (success) {
            req.session.currentUser = user._id
            return res.redirect('home.ejs')
          }
          // Error: Wrong password entered. Re-render page with errors shown to the user
          return res.render('auth-form.ejs', { data: req.body, errors: [{ field: 'password', message: 'The username and password combination is not correct. Please check your username and password and try again.' }], register: false })
        })
      })

    // Register request
    } else if (req.body.type === 'register') {
      // MongoDB request for the username to check if user with the username already exsists
      User.findOne({ username: req.body.username }, (err, user) => {
        // MongoDB Error
        if (err) return res.status(502).json({ error: err })
        // Error: user with the username already exsists
        if (user) return res.render('auth-form.ejs', { data: req.body, errors: [{ field: 'username', message: 'User with this username already exists. Please choose a new one.' }], register: true })

        // Hash password using bcrypt
        bcrypt.hash(req.body.password, 10, function(err, hash) {
          // Error whilst hashing password
          if (err) return res.render('auth-form.ejs', { data: req.body, errors: [{ field: 'password', message: 'Error encrypting the password. Try again.' }], register: true })
          // Success
          // MongoDB request for saving the user to the user collection
          User.create({ username: req.body.username, password: hash }, (err, user) => {
            // MongoDB error
            if (err) return res.status(502).json({ error: err })
            // Success
            // Set session for registered user (logged in)
            req.session.currentUser = user._id
            res.redirect('home.ejs')
          })
        })
      })
    } else {
     
    }
  } else {
  
  }
})

// GET: Logout User
router.get('/auth/logout', (req, res) => {
  // Destroy session
  req.session.destroy((err) => {
    // Redirect to home
    return res.redirect('home.ejs')
  })
})

// GET: Recipe page
router.get('/recipes', (req, res) => {
  // API Request: /api/recipes/all
  axios.get('http://localhost:8000/api/recipe/all').then(response => {
    // Use moment.js to format dateSubmitted from now (for example: "6 hours ago")
    response.data.recipes.forEach(recipe => {
      recipe.createdOn = moment(recipe.dateSubmitted).fromNow()
    })
    // Render recipe-list view with data from API response
    return res.render('recipe-list.ejs', { ...response.data, loggedIn: req.session.currentUser })
  }).catch(err => {
    // Catch API Error
    return res.status(500).json({
      message: 'Server Error.',
      error: err
    })
  })
})

// GET: Create New Recipe Form

router.get('/recipe/new', checkIfAuthenticated, (req, res) => {
  // Render recipe-form view
  res.render('recipe-form.ejs', { update: false, errors: [], data: {}, loggedIn: req.session.currentUser })
})

// POST: Create New Recipe

router.post('/recipe/new', checkIfAuthenticated, (req, res) => {
  const ingredients = req.body.ingredients
  req.body.ingredients = []
  // Filter out ingredients that are empty
  ingredients.forEach(ingredient => {
    if (!(!ingredient.name && !ingredient.amount && !ingredient.unit)) {
      req.body.ingredients.push(ingredient)
    }
  })
  // API Request: /api/recipe/new
  axios.post(`http://localhost:8000/api/recipe/new`, {
    ...req.body,
    // Passing currentUser id for authentication
    currentUser: {
      id: req.session.currentUser
    }
  }).then(response => {
    // Success: If 201 HTTP status recieved, redirect
    if (response.status === 201) {
      return res.redirect(`home.ejs`)
    } else {
      // Error: re-render recipe-form view with errors shown to the user
      return res.render('recipe-form.ejs', { update: false, data: req.body,...response.data, loggedIn: req.session.currentUser })
    }
  }).catch(err => {
    // Catch all other errors
    return res.json({
      message: 'Server Error.',
      error: err
    })
  })
})

// GET: Recipe Detail Page
router.get('/recipe/:id', (req, res) => {
  // API Request: /api/recipe/id
  axios.get(`http://localhost:8000/api/recipe/${req.params.id}`).then(response => {
    // Change line breaks for <br> tags so line breaks are shown to the user
    response.data.description = response.data.description.replace(/(?:\r\n|\r|\n)/g, '<br>')
    // Use moment.js to format dateSubmitted from now (for example: "6 hours ago")
    response.data.createdOn = moment(response.data.dateSubmitted).fromNow()
    // LoggedIn user state
    response.data.loggedIn = req.session.currentUser
    // Check if the recipe was created by current user: determines if update / delete controls are shown
    response.data.createdByCurrentUser = (response.data.creator.id === req.session.currentUser)
    // Render form-detail view
    res.render('recipe-details.ejs', response.data)
  }).catch(err => {
    // Handle recipe not found error
    if (err.response.status === 404) {
      return res.render('404.ejs', { type: 'Recipe', loggedIn: req.session.currentUser })
    }
    return res.status(500).json({
      message: 'Server Error.',
      error: err
    })
  })
})

// GET: Update Recipe Page

router.get('/recipe/:id/update', checkIfAuthenticated, (req, res) => {
  // API request: /api/recipe/id
  axios.get(`http://localhost:8000/api/recipe/${req.params.id}`).then(response => {
    // Render recipe-form view with pre-filled recipe data
    res.render('recipe-form.ejs', { update: true, errors: [], data: response.data, loggedIn: req.session.currentUser })
  }).catch(err => {
    if (err.response) {
      return res.json(err.response)
    }
    return res.status(500).json({
      message: 'Server Error.',
      error: err
    })
  })
})

// POST: Update Recipe

router.post('/recipe/:id/update', checkIfAuthenticated, (req, res) => {
  req.body._id = req.params.id
  const ingredients = req.body.ingredients
  req.body.ingredients = []
  // Filter out ingredients with not content
  ingredients.forEach(ingredient => {
    if (!(!ingredient.name && !ingredient.amount && !ingredient.unit)) {
      req.body.ingredients.push(ingredient)
    }
  })
  // API request: PUT /api/recipe/id
  axios.put(`http://localhost:8000/api/recipe/${req.params.id}`, {
    ...req.body,
    // Add currentUser id to body for authentication
    currentUser: {
      id: req.session.currentUser
    }
  }).then(response => {
    // If 201 HTTP status: Success
    if (response.status === 201) {
      return res.redirect(`home.ejs`)
    } else {
      // Error: re-render recupe-form with prefilled data and showing error messages to the user
      return res.render('recipe-form.ejs', { update: true, data: req.body,...response.data, loggedIn: req.session.currentUser })
    }
  }).catch(err => {
    // Error handling
    if (err.response) {
      return res.json(err.response)
    }
    return res.json({
      message: 'Server Error.',
      error: err
    })
  })
})

// GET: Delete Post

router.get('/recipe/:id/delete', checkIfAuthenticated, (req, res) => {
  // API Request: DELETE /api/recipe/id
  axios.delete(`http://localhost:8000/api/recipe/${req.params.id}`, {
    // Send userId in parameters for authentication
    params: {
      userId: req.session.currentUser
    }
  }).then(response => {
    return res.redirect('home.ejs')
  }).catch(err => {
    // Error handling
    if (err.response) {
      return res.json(err.response)
    }
    return res.json({
      message: 'Server Error.',
      error: err
    })
  })
})

module.exports = router
