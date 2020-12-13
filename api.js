// Dependencies
const router = require('express').Router()
const bcrypt = require('bcrypt')
const capitalize = require('lodash.capitalize')

// Mongoose Schemas
const Recipe = require('./models/recipe-model')
const User = require('./models/user-model')

// Function: check for authentication is required
const checkIfAuthenticated = (req, res, next) => {
  if (req.query.userId || (req.body.currentUser && req.body.currentUser.id)) {
    userId = req.query.userId ? req.query.userId : req.body.currentUser.id
    User.findById(userId, (err, user) => {
      // Error when invalid id is given (not ObjectId)
      if (err) return res.status(502).json({ error: 'Authentication failed.' })
      // Error when id doesn't match a user
      if (!user) return res.status(401).json({ error: 'Authentication failed.' })
      // Success: save user id and username in request body
      req.body.currentUser = {}
      req.body.currentUser.id = user._id
      req.body.currentUser.username = user.username
      return next()
    })
  } else {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    User.findOne({ username: username }, '_id password', (err, user) => {
      // Error when invalid id is given (not ObjectId)
      if (err) return res.status(502).json({ error: 'Authentication failed.' })
      // Error when username doesn't match a user
      if (!user) return res.status(401).json({ error: 'Authentication failed.' })
      // Check if password matches hash
      bcrypt.compare(password, user.password).then(success => {
        // Success
        if (success) {
          req.body.currentUser = {}
          req.body.currentUser.id = user._id
          req.body.currentUser.username = username
          return next()
        }
        // Error if password doesn't match
        return res.status(401).json({ error: 'Authentication failed.' })
      }).catch(() => {
        // Error when bcrypt fails to compare
        return res.status(500).json({ message: 'Server Error.' })
      })
    })
  }
}

// Function: Validate Data
const validateData = (data) => {
  const errors = []
  // Validate title (required)
  if (!data.title) {
    errors.push({ field: 'title', message: 'Recipe title is required.' })
  }
  // Validate difficulty (required)
  if (!data.difficulty) {
    errors.push({ field: 'difficulty', message: 'Recipe difficulty is required.' })
  // Validate difficulty (enum)
  } else if (!(['Easy', 'Medium', 'Hard'].includes(capitalize(data.difficulty)))) {
    errors.push({ field: 'difficulty', message: `Invalid recipe difficulty. Valid difficulties: 'Easy', 'Medium', 'Hard'.` })
  } else {
    data.difficulty = capitalize(data.difficulty)
  }
  // Validate duration (required)
  if (!data.duration) {
    errors.push({ field: 'duration', message: 'Recipe duration is required.' })
  // Validate duration (type & min)
  } else if (isNaN(parseInt(data.duration)) || parseInt(data.duration) < 0) {
    errors.push({ field: 'duration', message: `Invalid recipe duration. Must be positive integer.` })
  } else {
    data.duration = parseInt(data.duration)
  }
  // Validate ingredients (required)
  if (!data.ingredients || data.ingredients.length <= 0) {
    errors.push({ field: 'ingredients', message: 'Recipe ingredients are required.' })
  } else {
    // Validate individual Ingredients
    data.ingredients.forEach((ingredient, index) => {
      // Validate ingredient name (required)
      if (!ingredient.name) {
        errors.push({ field: `ingredient-${index}`, message: 'Ingredient name is required.' })
      }
      // Validate ingredient amount (type & min)
      if (ingredient.amount) {
        if (isNaN(parseInt(ingredient.amount)) || parseInt(ingredient.amount) < 0) {
          errors.push({ field: `ingredient-${index}`, message: 'Invalid ingredient amount. Must be positive integer.' })
        } else {
          ingredient.amount = parseInt(ingredient.amount)
        }
      }
    })
  }
  // Validate description (required)
  if (!data.description) {
    errors.push({ field: 'description', message: 'Recipe description is required.' })
  }
  // Return errors
  return errors
}

// GET: (/api/recipe/all) list all recipes in the database
router.get('/recipe/all', (req, res) => {
  Recipe.find({}, null, { sort: {dateSubmitted: -1} }, (err, recipes) => {
    // Catch error
    if (err) return res.status(502).json({ error: err, message: 'MongoDB encountered an error whilst trying to get all recipes.' })
    // Success
    res.status(200).json({
      message: 'success',
      count: recipes.length,
      recipes: recipes
    })
  })
})

// GET: (/api/recipe/id) specific recipe by id
router.get('/recipe/:id', (req, res) => {
  Recipe.findById(req.params.id, (err, recipe) => {
    // Error when recipe not found
    if (!recipe) return res.status(404).json({ error: `No recipe found for the id ${req.params.id}` })
    // Catch error (Invalid id)
    if (err) return res.status(502).json({ error: err, message: `MongoDB encountered an error whilst trying to get the recipe with the id ${req.params.id}.` })
    // Success
    res.status(200).json(recipe)
  })
})

// POST: (/api/recipe/new) upload new recipe

router.post('/recipe/new', checkIfAuthenticated, (req, res) => {
  // Input validation
  if (req.body) {
    const errors = validateData(req.body)

    // Check if any errors occured
    if (errors.length > 0) return res.json({ errors })
    
    // Compile relevant data in case there is additional attributes in the req.body
    const recipeData = {
      creator: {
        ...req.body.currentUser
      },
      title: req.body.title,
      difficulty: req.body.difficulty,
      duration: req.body.duration,
      ingredients: req.body.ingredients,
      description: req.body.description
    }
    // Add recipe to MongoDB
    Recipe.create(recipeData, (err, recipe) => {
      // Catch error
      if (err) return res.status(502).json({ error: err, message: 'MongoDB encountered an error whilst trying to save the recipe.' })
      // Success
      res.status(201).json({ message: 'Successfully saved new recipe', data: recipe })
    })
  } else {
    // Return error in case of no body
    return res.status(400).json({ error: 'No data provided' })
  }
})

// PUT: (/api/recipe/id) update recipe

router.put('/recipe/:id', checkIfAuthenticated, (req, res) => {
  // Input validation
  if (req.body) {
    const errors = validateData(req.body)

    // Check if any errors occured
    if (errors.length > 0) return res.json({ errors })
    
    // Compile relevant data in case there is additional attributes in the req.body
    const recipeData = {
      title: req.body.title,
      difficulty: req.body.difficulty,
      duration: req.body.duration,
      ingredients: req.body.ingredients,
      description: req.body.description
    }
    // Add recipe to MongoDB
    Recipe.findByIdAndUpdate(req.params.id, recipeData, { new: true }, (err, recipe) => {
      // Catch error
      if (err) return res.status(502).json({ error: err, message: 'MongoDB encountered an error whilst trying to update the recipe.' })
      // Success
      res.status(201).json({ message: 'Successfully updated recipe', data: recipe })
    })
  } else {
    // Return error in case of no body
    return res.status(400).json({ error: 'No data provided' })
  }
})

// DELETE: (/api/recipe/id) remove a recipe

router.delete('/recipe/:id', checkIfAuthenticated, (req, res) => {
  Recipe.findByIdAndDelete(req.params.id, (err, recipe) => {
    // Error when invalid id is given (not ObjectId)
    if (err) return res.status(502).json({ error: err, message: `MongoDB encountered an error whilst trying to delete the recipe with the id ${recipeId}.` })
    // Success
    if (recipe) {
      return res.status(200).json({ message: `Successfully deleted the recipe "${recipe.title}"` })
    }
    // Feedback when there is no recipe for the id
    return res.status(200).json({ message: `The recipe you tried to delete has already been deleted.` })
  })
})

module.exports = router
