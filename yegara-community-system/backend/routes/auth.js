const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  activateAccount,
  activateAccountWithToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/updatedetails', authenticate, updateDetails);
router.put('/updatepassword', authenticate, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/activate/:activationtoken', activateAccountWithToken);
router.put('/activate', authenticate, activateAccount);

module.exports = router;