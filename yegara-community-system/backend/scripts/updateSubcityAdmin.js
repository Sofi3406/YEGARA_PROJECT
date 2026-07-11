const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const ADMIN_UPDATE = {
  fullName: 'System Admin',
  email: 'yegara@gmail.com',
  password: 'Yegara@123',
  role: 'system_admin',
  isActive: true
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const user = await User.findOne({ $or: [{ email: ADMIN_UPDATE.email }, { role: 'system_admin' }] }).select('+password');
    if (!user) {
      console.error('System admin user not found. No changes were made.');
      process.exit(1);
    }

    user.fullName = ADMIN_UPDATE.fullName;
    user.role = ADMIN_UPDATE.role;
    user.isActive = ADMIN_UPDATE.isActive;
    user.password = ADMIN_UPDATE.password;

    await user.save();
    console.log('System admin user updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update system admin user:', error.message);
    process.exit(1);
  }
};

run();
