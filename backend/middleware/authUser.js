const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; 


const authenticate = (req, res, next) => {
  const token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    console.error('Invalid token:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authenticate;
