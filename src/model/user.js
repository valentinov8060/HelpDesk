const mongoose = require('mongoose');
const validator = require('validator');

require('./connect')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    maxlength: 60
  },
});

const User = mongoose.model('User', userSchema);

module.exports = {
  User
}

/* const bcrypt = require('bcrypt');

async function createUser() {
  await User.create({
    username: '2115061075',
    password: await bcrypt.hash('2115061075', 10)
  })
  console.log('done creating users')
}
createUser() */