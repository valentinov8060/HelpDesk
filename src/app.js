const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const moment = require('moment-timezone');

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

// Database
const { User } = require('./model/user')
const { Complaint } = require('./model/complaint')
require('./model/connect')

// Route untuk login
app.get('/login', (req, res) => {
  res.render('login', {
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
    res.status(500)
    res.render('error', {
      errorMessage: `Terjadi kesalahan: ${error.message}`
    })
  }
});

// Route untuk dashboard
app.get('/dashboard', authenticateToken, async (req, res) => {
  const complaintsData = await Complaint.find().select('noTiket waktuKirim kategori judul status');
  console.log(complaintsData)
  res.render('dashboard', {
    title: 'Dashboard',
    username: req.username,
    complaintsData: complaintsData
  });
});

app.post('/input-pengaduan', authenticateToken, async (req, res) => {
  const username = req.username;
  const { namaPelapor, kategori, namaPengaduan, masalah} = req.body;
  
  const currentDate = moment().tz("Asia/Jakarta");
  const year = currentDate.format('YYYY');
  const month = currentDate.format('MM');
  const day = currentDate.format('DD');
  const hour = currentDate.format('HH');
  const minute = currentDate.format('mm');
  const second = currentDate.format('ss');
  
  const noTiket = `TKT/${year}${month}${day}/${hour}${minute}${second}`
  const waktuKirim = currentDate.format('YYYY-MM-DD HH:mm:ss')

  await Complaint.create({
    username: username,
    noTiket: noTiket,
    waktuKirim: waktuKirim,
    kategori: kategori,
    judul: namaPengaduan,
    namaPelapor: namaPelapor,
    masalah: masalah,
  })
  
  res.redirect('/dashboard')
})

// Route untuk logout
app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/login');
});

// Route untuk halaman error
app.use('/', (req, res) => {
  res.status(404)
  res.render('error', {
    errorMessage: '404 Not Found'
  })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
