const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    // try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError('No document found with that ID, try again !', 404)
      );
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

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    // try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true // run validation in Models(Schema)
    });

    if (!doc) {
      return next(
        new AppError('No document found with that ID, try again !', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
    // } catch (err) {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: err
    //   });
    // }
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
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

    const doc = await Model.create(req.body);

    res.status(201).json({
      //201 Created
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // try {
    let query = Model.findById(req.params.id); // findById() behind the scenes is findOne()
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError('No document found with that ID, try again !', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
    // } catch (err) {
    //   res.status(404).json({
    //     status: 'fail',
    //     message: err
    //   });
    // }
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // To allow for nested GET reviews on tour (tricky and hack)

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    // const doc = await features.query.explain(); // explain() shows statistic of query like (num of result, num of docs query searching "totalDocsExamined")
    const doc = await features.query; // await here actually run query and returns documents

    // Send res back
    res.status(200).json({
      //200 Ok
      status: 'success',
      result: doc.length,
      data: {
        data: doc
      }
    });
  });
