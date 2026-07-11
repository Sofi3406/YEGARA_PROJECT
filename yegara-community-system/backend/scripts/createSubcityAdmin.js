const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const ADMIN_USER = {
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

    const existing = await User.findOne({ $or: [{ email: ADMIN_USER.email }, { role: 'system_admin' }] });
    if (existing) {
      existing.fullName = ADMIN_USER.fullName;
      existing.email = ADMIN_USER.email;
      existing.role = ADMIN_USER.role;
      existing.isActive = ADMIN_USER.isActive;
      existing.password = ADMIN_USER.password;
      await existing.save();
      console.log('System admin user updated successfully.');
      process.exit(0);
    }

    await User.create(ADMIN_USER);
    console.log('System admin user created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create system admin user:', error.message);
    process.exit(1);
  }
};

run();
