const express = require('express');
const tourController = require('./../controllers/tourController');

const router = express.Router();

// router.param('id', tourController.checkID); // checkID is param middleware

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
// .post(tourController.checkBody, tourController.createTour); // chaining multiple middlewares

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour) // PATCH updates small pieces of document, PUT replace existing document
  .delete(tourController.deleteTour);

module.exports = router;
