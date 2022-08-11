const { promisify } = require("util");
const jwt = ("jsonwebtoken");
const User = require("../models/User.js");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const cookieParser = require ("cookie-parser");
const express = require ("express");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSignedToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production ") cookies.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phoneNumber, country, email, password, confirmPassword } = req.body;

  const user = await User.create(req.body);

  createSignedToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new AppError("Please provide email and password for authentication", 400)
    );

  const user = await User.findOne({ email }).select("+password");
  // console.log(user);

  if (!user || !(await user.comparePassword(password, user.password)))
    return next(new AppError("Invalid email or password!", 401));

  user.password = undefined;

  createSignedToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Check if token exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError(
        "You are not logged in. Please log in to get autorization.",
        401
      )
    );
  // 2. Check if token is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user exist
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(new AppError("The user with this token does not exist", 401));

  // 4. Check if user hasn't changed password after token issuance

  // console.log(currentUser.passwordChangedAt);
  if (await currentUser.passwordChangedAfter(decoded.iat))
    return next(
      new AppError(
        "Password has been changed after this token was issued. Please log in again!",
        401
      )
    );
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => { };

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword)
    return next(new AppError("Please provide all required fields", 401));

  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.comparePassword(currentPassword, user.password)))
    return next(new AppError("The password is incorrect!"), 401);

  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;
  await user.save({ validateBeforeSave: true });

  createSignedToken(user, 201, res);

  console.log(user);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You are not authorized to perform this task", 403)
      );

    next();
  };
};