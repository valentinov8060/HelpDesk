const mongoose = require('mongoose');

require('./connect')

const complaintSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  noTiket: {
    type: String,
    required: true,
    unique: true,
    minlength: 19,
    maxlength: 19
  },
  waktuKirim: {
    type: String,
    required: true
  },
  kategori: {
    type: String,
    enum: ['Visa', 'Paspor'],
    required: true
  },
  judul: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 25
  },
  namaPelapor: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  masalah: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['posting', 'pending', 'resolved'],
    default: 'posting',
    required: true
  }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = {
  Complaint
}