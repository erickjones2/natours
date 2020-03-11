const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// **SETTING UP multer package**

// // This function is for directly store image in local storage in ROM
// const multerStorage = multer.diskStorage({
//   // cb() is callback, like next() function
//   // null is where we specify error
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// This function is directly store image in RAM as buffer for processing before image was actually store in ROM
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload image only !', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// This is multer milldeware handle photo upload
exports.updateUserPhoto = upload.single('photo'); // 'photo' is the field name from html form, 'single' image
// **DONE SETTING UP multer**

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Store image in RAM need to specify 'req.file.filename' to use in updateMe handler
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find({});

//   // Send res back
//   res.status(200).json({
//     //200 Ok
//     status: 'success',
//     result: users.length,
//     data: {
//       users
//     }
//   });
// });

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1. Create error if user POSTed password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Use /updatePassword instead !',
        400
      )
    );
  }

  // 2. Filter out unwanted fields name not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3. Update user data
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  // console.log(updatedUser);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(201).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is defined. Please use /signup instead !'
  });
};

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User); // Do not update password with this

exports.deleteUser = factory.deleteOne(User);
