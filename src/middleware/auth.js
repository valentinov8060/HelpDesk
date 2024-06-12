const jwt = require('jsonwebtoken');

const { User } = require('../model/user');

const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    res.status(401)
    res.render('error', {
      errorMessage: 'Unauthorized'
    })
  } else {
    jwt.verify(token, 'valentinov', async (err, decoded) => {
      if (err) {
        res.status(403)
        res.render('error', {
          errorMessage: 'Forbidden'
        })
      } else {
        try {
          const checkUsername = await User.findOne({ username: decoded.username });
          if (!checkUsername) {
            res.status(401)
            res.render('error', {
              errorMessage: 'User Not Found'
            })
          } 
          req.username = decoded.username;
          next();
        } catch (error) {
          res.status(500)
          res.render('error', {
            errorMessage: `Terjadi kesalahan: ${error.message}`
          })
        }
      }
    });
  }
};

module.exports = authenticateToken;
