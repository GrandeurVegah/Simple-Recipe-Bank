mongoose = require('mongoose')
const Schema = mongoose.Schema

const recipeSchema = new Schema({
  creator: {
    id: {
      type: mongoose.ObjectId,
      required: [true, 'Missing creator id']
    },
    username: {
      type: String,
      required: [true, 'Missing creator name']
    }
  },
  title: {
    type: String,
    required: [true, 'Missing recipe title']
  },
  difficulty: {
    type: String,
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: 'Invalid recipe difficulty'
    },
    required: [true, 'Missing recipe title'],
    default: 'Easy'
  },
  duration: {
    type: Number,
    min: [0, 'Invalid recipe duration: negative numbers are not valid'],
    max: [1440, 'Invalid recipe duration: the maximum duration is 24 hours (1440 minutes)'],
    required: [true, 'Missing recipe duration']
  },
  ingredients: [{
    name: {
      type: String,
      required: [true, 'Missing ingredient name']
    },
    amount: {
      type: Number,
      min: [0, 'Invalid ingredient amount: negative numbers are not valid']
    },
    unit: String
  }],
  description: {
    type: String,
    required: [true, 'Missing recipe description']
  },
  dateSubmitted: {
    type: Date,
    default: Date.now,
    required: [true, 'Missing date']
  }
})

const Recipe = mongoose.model('recipe', recipeSchema)

module.exports = Recipe
