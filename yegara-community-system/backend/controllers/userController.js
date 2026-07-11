const User = require('../models/User');
const { createActivationToken, buildActivationUrl } = require('../utils/activationToken');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const { buildWoredaRegex, isSameWoreda } = require('../utils/woreda');
const {
  canAccessUser,
  isValidAdminAssignment,
  prepareManagedUserPayload,
  scopeQueryForUser,
  normalizeScopeValue
} = require('../utils/adminHierarchy');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    if (!['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    let query = scopeQueryForUser(req.user);
    
    // Filter by role if specified
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Filter by department if specified
    if (req.query.department) {
      query.department = req.query.department;
    }

    if (req.query.region && req.query.region !== 'all') {
      query.region = normalizeScopeValue(req.query.region);
    }

    if (req.query.subcity && req.query.subcity !== 'all') {
      query.subcity = normalizeScopeValue(req.query.subcity);
    }

    if (req.query.woreda && req.query.woreda !== 'all') {
      const woredaRegex = buildWoredaRegex(req.query.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.query.woreda;
    }
    
    const users = await User.find(query).select('-password').sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Self)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check authorization
    if (req.user.role === 'resident' && req.user.id !== req.params.id) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    if (!canAccessUser(req.user, user)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res, next) => {
  try {
    if (!['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized to create users', 403));
    }
    
    const { email, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists', 400));
    }

    if (!isValidAdminAssignment(req.user, role)) {
      return next(new ErrorResponse('Can only create the next level admin role', 403));
    }
    
    // Generate password and access code
    const tempPassword = Math.random().toString(36).slice(-8);
    const accessCode = role === 'officer' ? User.generateAccessCode() : undefined;
    const { plainToken, activationToken, activationExpire } = createActivationToken();

    const userData = prepareManagedUserPayload(req.user, {
      ...req.body,
      password: tempPassword,
      accessCode,
      isActive: false,
      mustChangePassword: role !== 'officer',
      activationToken,
      activationExpire
    });

    const user = await User.create(userData);

    const activateUrl = buildActivationUrl(plainToken);

    // Send activation email
    const message = `
      <h2>Welcome to Yegara Community System</h2>
      <p>Your account has been created as a ${role}.</p>
      ${role === 'officer' ? `<p>Your access code: <strong>${accessCode}</strong></p>` : ''}
      <p>Click the link below to set your password and activate your account:</p>
      <p><a href="${activateUrl}">${activateUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
    `;
    
    await sendEmail({
      email: user.email,
      subject: 'Account Activation - Yegara Community System',
      html: message
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        region: user.region,
        subcity: user.subcity,
        woreda: user.woreda,
        department: user.department,
        customDepartment: user.customDepartment
      },
      message: 'User created successfully. Activation email sent.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Self)
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check authorization
    if (req.user.role === 'resident' && req.user.id !== req.params.id) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    if (!canAccessUser(req.user, user)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    // Remove password from update if present
    delete req.body.password;
    
    // Update user
    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    if (!['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    if (!canAccessUser(req.user, user)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    // Can't delete yourself
    if (req.user.id === req.params.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users by woreda
// @route   GET /api/users/woreda/:woreda
// @access  Private (Admin)
exports.getUsersByWoreda = async (req, res, next) => {
  try {
    if (!['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    if (!canAccessUser(req.user, { region: req.user.region, subcity: req.user.subcity, woreda: req.params.woreda })) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const woredaRegex = buildWoredaRegex(req.params.woreda);
    const users = await User.find(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.params.woreda })
      .select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (Admin)
exports.getUsersByRole = async (req, res, next) => {
  try {
    if (!['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    
    let query = { role: req.params.role };

    query = { ...query, ...scopeQueryForUser(req.user) };
    
    const users = await User.find(query).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};