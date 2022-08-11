const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super-admin'],
      default: 'user',
    },
    phoneNumber: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: [true, 'Password is needed for authentication'],
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords does not match',
      },
    },
   country: {
    type: String,
    required: true,
    
    default: 'nigeria'
   },
    passwordChangedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  },
  // {
  //   timestamps: true,
  // },
);
// tourSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'tour',
//   localField: '_id',
//   select: '-__v'
// });

userSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'user',
  localField: '_id',
  select: '-__v'
});

// Middleware to hash password and delete confirmPassword entry before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // console.log(this.password);

  this.confirmPassword = undefined;
  next();
});

// Middleware to check if password was changed and create a timestamp if it got changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 2000;
  next();
});

// Middleware to compare passwords before a user is authenticated
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAtTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < passwordChangedAtTime;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
