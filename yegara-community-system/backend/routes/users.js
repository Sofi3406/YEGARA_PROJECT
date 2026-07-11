const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByWoreda,
  getUsersByRole
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.route('/')
  .get(authorize('system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'), getUsers)
  .post(authorize('system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'), createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(authorize('system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'), deleteUser);

router.get('/woreda/:woreda', authorize('system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'), getUsersByWoreda);
router.get('/role/:role', authorize('system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin'), getUsersByRole);

module.exports = router;