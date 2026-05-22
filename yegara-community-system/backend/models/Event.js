const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: String,
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: Date,
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  woreda: {
    type: String,
    required: true
  },
  category: String,
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  guestAttendees: [{
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxAttendees: Number,
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  images: [String],
  meetingLink: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);