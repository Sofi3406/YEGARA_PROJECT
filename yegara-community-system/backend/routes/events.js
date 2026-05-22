const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByWoreda,
  registerForEvent,
  getPublicEvents,
  getPublicEvent
} = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const { optionalAuthenticate } = require('../middleware/auth');
const upload = require('../utils/upload');

// Public routes (available without authentication)
const { publicLimiter } = require('../middleware/rateLimiter');
router.get('/public', publicLimiter, getPublicEvents);
router.get('/public/:id', publicLimiter, getPublicEvent);
router.post('/:id/register', publicLimiter, optionalAuthenticate, registerForEvent);

router.use(authenticate);

router.route('/')
  .get(getEvents)
  .post(authorize('woreda_admin', 'subcity_admin'), upload.array('images', 5), createEvent);

router.route('/:id')
  .get(getEvent)
  .put(authorize('woreda_admin', 'subcity_admin'), upload.array('images', 5), updateEvent)
  .delete(authorize('woreda_admin', 'subcity_admin'), deleteEvent);

router.get('/woreda/:woreda', getEventsByWoreda);

module.exports = router;