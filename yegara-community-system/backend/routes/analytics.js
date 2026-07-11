const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getRealtimeData,
  exportAnalytics
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('system_admin', 'regional_admin', 'subcity_admin'));

router.get('/', getAnalytics);
router.get('/realtime', getRealtimeData);
router.get('/export', exportAnalytics);

module.exports = router;