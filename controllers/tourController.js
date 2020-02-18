const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // try {
  // // Build a query
  // // 1. Filtering
  // const queryObj = { ...req.query };
  // const excludedQuery = ['page', 'sort', 'limit', 'fields'];
  // excludedQuery.forEach(el => delete queryObj[el]); //delete operator

  // // 2. Advanced filtering
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  // // const query = await Tour.find() // because of returning Query obj we can chain method
  // //   .where('durations')
  // //   .equals(5)
  // //   .where('difficulty')
  // //   .equals('easy');

  // let query = Tour.find(JSON.parse(queryStr)); // Tour.find(queryObj) returns Query obj

  // // 3. Sorting
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // // 4. Fields limitation
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   query = query.select('-__v'); // - aka minus means exclude
  // }

  // // 5. Pagination
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 10; // limit documents per page
  // const skip = (page - 1) * limit;

  // // ex: page 2: from 11 -> 20
  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   const tourNum = Tour.countDocuments();
  //   if (skip >= tourNum) {
  //     throw new Error('This page does not exist');
  //   }
  // }

  // FINNAL: Execute query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const tours = await features.query; // await here actually run query and returns documents

  // Send res back
  res.status(200).json({
    //200 Ok
    status: 'success',
    result: tours.length,
    data: {
      tours
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.getTour = catchAsync(async (req, res, next) => {
  // try {
  const { id } = req.params;
  const tour = await Tour.findById(id); // findById() behind the scenes is findOne()

  if (!tour) {
    return next(new AppError('No tour found with that ID, try again !', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

// createTour must be function not be result of function, so catchAsync() must return a function
exports.createTour = catchAsync(async (req, res, next) => {
  // try {
  //   const newTour = await Tour.create(req.body);

  //   res.status(201).json({
  //     //201 Created
  //     status: 'success',
  //     data: {
  //       newTour
  //     }
  //   });
  // } catch (err) {
  //   res.status(400).json({
  //     // 400 Bad Request
  //     status: 'fail',
  //     message: err
  //   });
  // }

  const newTour = await Tour.create(req.body);

  res.status(201).json({
    //201 Created
    status: 'success',
    data: {
      newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // try {
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true // run validation in Models(Schema)
  });

  if (!updatedTour) {
    return next(new AppError('No tour found with that ID, try again !', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedTour
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // try {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID, try again !', 404));
  }

  res.status(204).json({
    // 204 No Content
    status: 'success',
    data: null
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

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
