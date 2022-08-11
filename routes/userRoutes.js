const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  protect,
  updatePassword,
  restrictTo,
} = require( '../controllers/authController.js');
const {
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  updateMe,
  updateUser,
} = require( '../controllers/userController.js');

router.patch('/updatePassword', protect, updatePassword);
router.patch('/updateMe', protect, updateMe);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe, getUser);

router.get('/', protect, restrictTo('super-admin', 'admin'), getAllUsers);
router.route('/:id').get(protect, getUser).patch(protect, restrictTo('super-admin', 'admin'), updateUser).delete(protect, restrictTo('super-admin', 'admin'), deleteUser);

module.exports = router;
