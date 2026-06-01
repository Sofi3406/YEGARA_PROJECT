const express = require('express');
const router = express.Router();
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  getReportsByWoreda,
  getReportsByDepartment,
  getMyReports,
  getPublicUpdates,
  postUpdate
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

// Apply authentication to all routes
router.use(authenticate);

router.route('/')
  .get(getReports)
  .post(upload.array('images', 5), createReport);

router.route('/my-reports')
  .get(getMyReports);

router.route('/public-updates')
  .get(getPublicUpdates);

router.route('/:id')
  .get(getReport)
  .put(upload.array('images', 5), updateReport)
  .delete(deleteReport);

router.route('/:id/updates')
  .post(authorize('officer', 'woreda_admin', 'subcity_admin'), postUpdate);

router.route('/woreda/:woreda')
  .get(authorize('woreda_admin', 'subcity_admin'), getReportsByWoreda);

router.route('/department/:department')
  .get(authorize('officer', 'woreda_admin', 'subcity_admin'), getReportsByDepartment);

module.exports = router;