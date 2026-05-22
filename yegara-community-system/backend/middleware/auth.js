const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const allowedAuthPaths = ['/api/auth/activate', '/api/auth/me', '/api/auth/logout'];
    const isAllowedAuthPath = allowedAuthPaths.some((path) => req.originalUrl.includes(path));

    if (!req.user.isActive && req.user.role !== 'resident') {
      if (!isAllowedAuthPath) {
        return res.status(403).json({
          success: false,
          error: 'Please activate your account first'
        });
      }
    }

    if (req.user.mustChangePassword) {
      if (!isAllowedAuthPath) {
        return res.status(403).json({
          success: false,
          error: 'Please change your password before continuing'
        });
      }
    }
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

exports.optionalAuthenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    return next();
  } catch (err) {
    return next();
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};