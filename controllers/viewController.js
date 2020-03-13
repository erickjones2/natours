const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking') {
    res.locals.alert =
      'Your booking was successful, please check your email for comfirmation.\nIf your booking does not show up here immediately, please check again later or reload the page';
  }

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All tours',
    tours: tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get data for the requested tour(include reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name !', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour: tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login to account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account information'
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  // 1. Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2. Find tours with returned bookings
  const tourIds = bookings.map(el => el.tour.id);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My booked tours',
    tours
  });
});
