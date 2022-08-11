const User = require('../models/User.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    length: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate({ path: 'orders' });

  if (!user)
    return next(
      new AppError(`No user with that ${req.params.id} exist on this server`)
    );

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        'This route is not for password update. Use the update password link for that',
        400
      )
    );

  const filteredFields = filterObj(req.body, 'name', 'email',);
  const { address, city, country } = req.body;

  const shippingAddress = {};

  shippingAddress.address = address;
  shippingAddress.city = city;
  shippingAddress.country = country;

  filteredFields.shippingAddress = shippingAddress;


  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredFields, {
    new: true,
    runValidators: true,
  }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  console.log('Hey');
  next();
};

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new AppError('User not found on this server', 404));

  const updatedUser = await User.findByIdAndUpdate(user._id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndRemove(req.params.id);

  if (!user) return next(new AppError('User not found on this server', 404));

  res.status(204).json({
    status: 'success'
  });
});