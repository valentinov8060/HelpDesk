const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');

// File statis
const fs = require('fs');

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
    if (userData && await bcrypt.compare(password, userData.password)) {
      const token = jwt.sign({ username }, 'valentinov');
      res.cookie('authToken', token, { httpOnly: true, secure: true, maxAge: 3600000 });
      res.redirect('/dashboard');
    } else {
      req.flash('loginFailedMessage', 'Username atau password salah');
      res.redirect('/login');
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
  const complaintsData = await Complaint.find().select('noTiket waktuKirim kategori judul status namaPelapor masalah username');
  res.render('dashboard', {
    title: 'Dashboard',
    username: req.username,
    complaintsData: complaintsData
  });
});

app.post('/input-pengaduan', authenticateToken, async (req, res) => {
  const username = req.username;
  const { namaPelapor, kategori, namaPengaduan, masalah } = req.body;

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

app.post('/generate-pdf', authenticateToken, async (req, res) => {
  try {
    // Mendapatkan tanggal
    let { startDate, endDate } = req.body;
    startDate = startDate + ' 00:00:00';
    endDate = endDate + ' 23:59:59';
    
    // Mengambil data dari MongoDB
    const complaints = await Complaint.find({
      waktuKirim: {
        $gte: startDate,
        $lte: endDate
      }
    })

    // Membuat dokumen PDF baru
    const doc = new PDFDocument();

    // Stream dokumen PDF ke file
    const stream = fs.createWriteStream('pengaduan-masyarakat.pdf');
    doc.pipe(stream);

    // Menambahkan judul ke PDF
    doc.fontSize(25).text('Data Pengaduan Masyarakat', { align: 'center' });
    doc.fontSize(12).text(`Periode: ${req.body.startDate} - ${req.body.endDate}`, { align: 'center' });

    // Menambahkan data dari MongoDB ke PDF
    complaints.forEach(complaint => {
      doc.moveDown();
      doc.fontSize(12).text(`No Tiket: ${complaint.noTiket}`);
      doc.fontSize(12).text(`Waktu Kirim: ${complaint.waktuKirim}`);
      doc.fontSize(12).text(`Kategori: ${complaint.kategori}`);
      doc.fontSize(12).text(`Judul: ${complaint.judul}`);
      doc.fontSize(12).text(`Nama Pelapor: ${complaint.namaPelapor}`);
      doc.fontSize(12).text(`Status: ${complaint.status}`);
      doc.fontSize(12).text(`Masalah: ${complaint.masalah}`);
      doc.fontSize(12).text(`Petugas: ${complaint.username}`);
      doc.moveDown();
    });

    // Menyelesaikan pembuatan PDF
    doc.end();

    // Mengirimkan PDF ke klien setelah selesai
    stream.on('finish', () => {
      res.download('pengaduan-masyarakat.pdf');
    });

  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

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
