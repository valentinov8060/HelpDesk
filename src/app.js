const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

// Set EJS sebagai view engine
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Middleware untuk melayani file statisparsing, body request, dan cookie parser 
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware untuk session dan flash messages
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(flash());

// Middleware untuk autentikasi
const authenticateToken = require('./middleware/auth');

const { User } = require('./model/user')
require('./model/connect')

// Route untuk halaman login
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    loginFailedMessage: req.flash('loginFailedMessage'),
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userData = await User.findOne({ username });
    console.log(userData)
    if (userData && await bcrypt.compare(password, userData.password)) {
      const token = jwt.sign({ username }, 'valentinov');

      res.cookie('authToken', token, { httpOnly: true, secure: true, maxAge: 3600000 });
      console.log('Login Berhasil: ', userData, token)

      res.redirect('/dashboard');
    } else {
      req.flash('loginFailedMessage', 'Username atau password salah');
      res.redirect('/login');
      console.log('Login Gagal')
    }
  } catch (error) {
    res.status(500).send('Terjadi kesalahan: ' + error.message);
  }
});

// Route untuk halaman dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    username: req.username,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
