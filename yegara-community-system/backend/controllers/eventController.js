const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const { buildWoredaRegex } = require('../utils/woreda');

const toWebPath = (filePath = '') => filePath.replace(/\\/g, '/');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Event.find(JSON.parse(queryStr)).populate('organizer', 'fullName email role');

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Event.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    const events = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public events (read-only)
// @route   GET /api/events/public
// @access  Public
exports.getPublicEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const baseFilter = { status: { $ne: 'Draft' }, isPublic: { $ne: false } };

    const total = await Event.countDocuments(baseFilter);

    const events = await Event.find(baseFilter)
      .select('title description date endDate location images woreda status createdAt')
      .populate('organizer', 'fullName role')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const pagination = {};
    if (startIndex + events.length < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({ success: true, count: events.length, pagination, data: events });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single public event (read-only)
// @route   GET /api/events/public/:id
// @access  Public
exports.getPublicEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('-attendees')
      .populate('organizer', 'fullName role');

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.isPublic === false) {
      return next(new ErrorResponse('Event is not public', 403));
    }

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName email role')
      .populate('attendees', 'fullName email');

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Woreda/Subcity Admin)
exports.createEvent = async (req, res, next) => {
  try {
    req.body.organizer = req.user.id;

    if (req.user.role === 'subcity_admin' && !req.body.woreda) {
      req.body.woreda = 'All Woredas';
    }

    if (!req.body.woreda && req.user.woreda) {
      req.body.woreda = req.user.woreda;
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => toWebPath(file.path));
    }

    const event = await Event.create(req.body);

    const io = req.app.get('io');
    if (io) {
      let recipientQuery = {
        _id: { $ne: req.user.id },
        isActive: true
      };

      if (event.woreda && event.woreda !== 'All Woredas') {
        const woredaRegex = buildWoredaRegex(event.woreda);
        recipientQuery = {
          ...recipientQuery,
          $or: [
            woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: event.woreda },
            { role: 'subcity_admin' }
          ]
        };
      }

      const recipients = await User.find(recipientQuery).select('_id');
      if (recipients.length > 0) {
        const notificationDocs = recipients.map((recipient) => ({
          recipient: recipient._id,
          actor: req.user.id,
          type: 'event_created',
          message: `New event published: ${event.title}`,
          metadata: {
            eventId: event._id,
            woreda: event.woreda
          }
        }));

        const createdNotifications = await Notification.insertMany(notificationDocs);

        createdNotifications.forEach((notification) => {
          io.to(`user-${notification.recipient.toString()}`).emit('notification', {
            id: notification._id,
            type: notification.type,
            message: notification.message,
            read: notification.read,
            createdAt: notification.createdAt,
            metadata: notification.metadata
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Woreda/Subcity Admin)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.organizer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this event', 403));
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => toWebPath(file.path));
      req.body.images = [...event.images, ...newImages];
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Woreda/Subcity Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.organizer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this event', 403));
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events by woreda
// @route   GET /api/events/woreda/:woreda
// @access  Private
exports.getEventsByWoreda = async (req, res, next) => {
  try {
    const woredaRegex = buildWoredaRegex(req.params.woreda);
    const woredaFilter = woredaRegex
      ? { $or: [{ woreda: { $regex: woredaRegex } }, { woreda: 'All Woredas' }] }
      : { $or: [{ woreda: req.params.woreda }, { woreda: 'All Woredas' }] };

    const events = await Event.find(woredaFilter)
      .populate('organizer', 'fullName email role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (event.status === 'Cancelled' || event.status === 'Completed') {
      return next(new ErrorResponse('Event is not open for registration', 400));
    }

    const attendeeCount = event.attendees.length + (event.guestAttendees?.length || 0);
    if (event.maxAttendees && attendeeCount >= event.maxAttendees) {
      return next(new ErrorResponse('Event has reached maximum capacity', 400));
    }

    if (req.user) {
      const alreadyRegistered = event.attendees.some(
        attendee => attendee.toString() === req.user.id
      );

      if (alreadyRegistered) {
        return next(new ErrorResponse('You are already registered for this event', 400));
      }

      event.attendees.push(req.user.id);
    } else {
      const fullName = String(req.body.fullName || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const phone = String(req.body.phone || '').trim();

      if (!fullName || !email) {
        return next(new ErrorResponse('Full name and email are required for public registration', 400));
      }

      const alreadyRegistered = (event.guestAttendees || []).some(
        attendee => attendee.email === email
      );

      if (alreadyRegistered) {
        return next(new ErrorResponse('You are already registered for this event', 400));
      }

      event.guestAttendees = event.guestAttendees || [];
      event.guestAttendees.push({ fullName, email, phone });
    }

    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};
