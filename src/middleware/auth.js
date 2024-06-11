const jwt = require('jsonwebtoken');

const { User } = require('../model/user');

const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  console.log(token);
  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, 'valentinov', async (err, decoded) => {
    if (err) return res.sendStatus(403); // Forbidden
    try {
      const checkUsername = await User.findOne({ username: decoded.username });
      if (!checkUsername) return res.sendStatus(404); // Not Found

      req.username = decoded.username;
      next();
    } catch (error) {
      res.status(500).send('Terjadi kesalahan: ' + error.message);
    }
  });
};

module.exports = authenticateToken;
