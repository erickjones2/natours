const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

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
exports.updateTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1 // max image upload with coressponding field
  },
  {
    name: 'images',
    maxCount: 3
  }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  // 1. Cover image
  const imageCoverName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverName}`);
  req.body.imageCover = imageCoverName;

  // 2. Images
  req.body.images = [];

  // if we use forEach() instead of map() like below, req.body.images can be empty when next() was called. Because callback() in forEach()
  // is async but forEach() is not async. sharp() run in background and app cant run to push()
  await Promise.all(
    req.files.images.map(async (image, index) => {
      const imageTourName = `tour-${req.params.id}-${Date.now()}-${index +
        1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageTourName}`);

      req.body.images.push(imageTourName);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // try {
//   // // Build a query
//   // // 1. Filtering
//   // const queryObj = { ...req.query };
//   // const excludedQuery = ['page', 'sort', 'limit', 'fields'];
//   // excludedQuery.forEach(el => delete queryObj[el]); //delete operator

//   // // 2. Advanced filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

//   // // const query = await Tour.find() // because of returning Query obj we can chain method
//   // //   .where('durations')
//   // //   .equals(5)
//   // //   .where('difficulty')
//   // //   .equals('easy');

//   // let query = Tour.find(JSON.parse(queryStr)); // Tour.find(queryObj) returns Query obj

//   // // 3. Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   // // 4. Fields limitation
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v'); // - aka minus means exclude
//   // }

//   // // 5. Pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 10; // limit documents per page
//   // const skip = (page - 1) * limit;

//   // // ex: page 2: from 11 -> 20
//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const tourNum = Tour.countDocuments();
//   //   if (skip >= tourNum) {
//   //     throw new Error('This page does not exist');
//   //   }
//   // }

//   // FINNAL: Execute query
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();

//   const tours = await features.query; // await here actually run query and returns documents

//   // Send res back
//   res.status(200).json({
//     //200 Ok
//     status: 'success',
//     result: tours.length,
//     data: {
//       tours
//     }
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err
//   //   });
//   // }
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // try {
//   const { id } = req.params;
//   const tour = await Tour.findById(id).populate('reviews'); // findById() behind the scenes is findOne()

//   if (!tour) {
//     return next(new AppError('No tour found with that ID, try again !', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err
//   //   });
//   // }
// });

// createTour must be function not be result of function, so catchAsync() must return a function
exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Aggregation pipline
  // try {
  const stats = await Tour.aggregate([
    // every objs in this array was called stage
    {
      $match: { ratingsAverage: { $gte: 2.5 } } // filter documents that matched this criteria
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // _id means group by _id
        tourNum: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } // 1 means ascending
    }
    // We can chain multiple stages
    // {
    //   $match: { _id: { $ne: 'MEDIUM' } } // $ne: not equal
    // }
  ]);

  res.status(200).json({
    //200 Ok
    status: 'success',
    result: stats.length,
    data: {
      stats
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStart: { $sum: 1 },
        tour: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $sort: { month: -1 }
    },
    {
      $limit: 12 //limit number of documents
    }
  ]);

  res.status(200).json({
    //200 Ok
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in fomrat: lat lng !',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in fomrat: lat lng !',
        400
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
