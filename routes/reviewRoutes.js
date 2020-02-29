const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// POST /tours/129129wdkwe/reviews/
// POST /reviews/
// all goes to here

const router = express.Router({ mergeParams: true });
// Set { mergeParams: true } because in tourRoutes we used nested route "router.use('/:tourId/reviews', reviewRouter);"
// using mergeParams: true to access params "tourId" because params is accessible in one
// specific tour, not other tour. To access "tourId" from tourRoute in reviewRoutes, we set "true"

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
