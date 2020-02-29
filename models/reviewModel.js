const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be emty !']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belongs to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belongs to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexing compound of (tour and user) as a unique index stored in DB. So DB now only
// accepted unique a couple of tour and user stored in DB
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// STATIC METHOD: (Usage: Review.staticMethod())
// Create static method because we want to use aggregate(), Model.aggregate().
// And "this" in static method points to Model
reviewSchema.statics.calAverageRatings = async function(tourId) {
  // "this" points to Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5
    });
  }
};

// Calculate calAverageRatings after saving to DB
reviewSchema.post('save', function() {
  // "this" points to current review
  // "this.constructor." === "Review." .But we can use "Review." because Review was not declared
  // Review declared below, code run in sequence
  this.constructor.calAverageRatings(this.tour);
});

// ***Calculate calAverageRatings after update or delete to DB
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this.findOne(); returns 1 doc in DB match with findByIdAnd...
  // Then we stored doc to this.r
  this.r = await this.findOne();

  next();
});

// reviewSchema.pre(/^findByIdAnd/) ===> reviewSchema.post(/^findByIdAnd/) is the way we pass arg from this middleware to anothor

reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calAverageRatings(this.r.tour);
});
// ***End calculate calAverageRatings

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
