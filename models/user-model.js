const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username missing.'],
    unique: [true, 'Username must be unique í ½í±¿']
  },
  password: {
    type: String,
    required: [true, 'Password missing.']
  }
})

const User = mongoose.model('user', userSchema)

module.exports = User
