const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const crypto = require('crypto');
const {
  createActivationToken,
  hashActivationToken,
  buildActivationUrl
} = require('../utils/activationToken');
const { normalizeScopeValue } = require('../utils/adminHierarchy');

// Generate JWT Token
const sendTokenResponse = (user, statusCode, res, extra = {}) => {
  const token = user.getSignedJwtToken();
  
  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRE);
  const cookieTtlMs = Number.isFinite(cookieDays) ? cookieDays * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const options = {
    expires: new Date(Date.now() + cookieTtlMs),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        region: user.region,
        subcity: user.subcity,
        woreda: user.woreda,
        department: user.department
      },
      ...extra
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      role,
      region,
      subcity,
      woreda,
      department,
      customRegionName,
      customSubcityName,
      customWoredaName
    } = req.body;

    if (role && role !== 'resident') {
      return next(new ErrorResponse('Public registration is for residents only', 403));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists', 400));
    }

    let finalRegion = normalizeScopeValue(region);
    let finalSubcity = normalizeScopeValue(subcity);
    let finalWoreda = normalizeScopeValue(woreda);

    if (region === 'Other') {
      if (!customRegionName || !customRegionName.trim()) {
        return next(new ErrorResponse('Please provide your region name', 400));
      }
      finalRegion = customRegionName.trim();
    }

    if (subcity === 'Other') {
      if (!customSubcityName || !customSubcityName.trim()) {
        return next(new ErrorResponse('Please provide your sub city name', 400));
      }
      finalSubcity = customSubcityName.trim();
    }

    if (!finalRegion || !finalSubcity || !finalWoreda) {
      return next(new ErrorResponse('Please select region, sub city, and woreda', 400));
    }

    if (woreda === 'Other') {
      if (!customWoredaName || !customWoredaName.trim()) {
        return next(new ErrorResponse('Please provide your woreda name', 400));
      }
      finalWoreda = customWoredaName.trim();
    }

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role: 'resident',
      region: finalRegion,
      subcity: finalSubcity,
      woreda: finalWoreda,
      department,
      customWoredaName: woreda === 'Other' ? finalWoreda : undefined,
      isActive: true
    });

    if (woreda === 'Other') {
      const systemAdmins = await User.find({ role: 'system_admin', isActive: true });
      const io = req.app.get('io');

      await Promise.all(
        systemAdmins.map(async (admin) => {
          if (admin.email) {
            const emailBody = `
              <h2>New Woreda Request</h2>
              <p>A resident registered with a woreda not yet listed.</p>
              <p><strong>Region:</strong> ${finalRegion}</p>
              <p><strong>Sub city:</strong> ${finalSubcity}</p>
              <p><strong>Requested Woreda:</strong> ${finalWoreda}</p>
              <p><strong>Resident:</strong> ${fullName} (${email})</p>
            `;

            await sendEmail({
              email: admin.email,
              subject: 'New Woreda Request - Yegara',
              html: emailBody
            });
          }

          if (io) {
            io.to(`user-${admin._id.toString()}`).emit('notification', {
              type: 'woreda_request',
              message: `New woreda requested: ${finalWoreda}`,
              woreda: finalWoreda
            });
          }
        })
      );
    }

    // Send activation email for officers/admins
    if (role !== 'resident') {
      const { plainToken, activationToken, activationExpire } = createActivationToken();
      user.activationToken = activationToken;
      user.activationExpire = activationExpire;
      await user.save({ validateBeforeSave: false });

      const activateUrl = buildActivationUrl(plainToken);
      const message = `
        <h2>Welcome to Yegara Community System</h2>
        <p>Your account has been created as a ${role}.</p>
        <p>Click the link below to set your password and activate your account:</p>
        <p><a href="${activateUrl}">${activateUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Account Activation - Yegara Community System',
        html: message
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const requiresActivation = !user.isActive && user.role !== 'resident';
    const requiresPasswordChange = user.mustChangePassword === true;

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, { requiresActivation, requiresPasswordChange });
  } catch (err) {
    next(err);
  }
};

// @desc    Activate account (logged in after first login)
// @route   PUT /api/auth/activate
// @access  Private
exports.activateAccount = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    user.password = newPassword;
    user.isActive = true;
    user.mustChangePassword = false;
    user.activationToken = undefined;
    user.activationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account activated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Activate account via email link
// @route   PUT /api/auth/activate/:activationtoken
// @access  Public
exports.activateAccountWithToken = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    const user = await User.findOne({
      activationToken: hashActivationToken(req.params.activationtoken),
      activationExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid or expired activation link', 400));
    }

    user.password = newPassword;
    user.isActive = true;
    user.mustChangePassword = false;
    user.activationToken = undefined;
    user.activationExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    region: req.body.region,
    subcity: req.body.subcity,
    woreda: req.body.woreda
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `
    <h2>You have requested a password reset</h2>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    <p>This link will expire in 10 minutes.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html: message
    });

    res.status(200).json({
      success: true,
      message: 'Email sent'
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};