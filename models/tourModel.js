const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  // Schema(definition-schema, options-schema)
  {
    // Schema-type options definition
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // This was called validator
      unique: true,
      maxlength: [40, 'Tour name must <= 40 characters'], // This was called validator
      minlength: [10, 'Tour name must >= 10 characters'] // This was called validator
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a durations']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        // This was called validator
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty either easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true // remove all space from end and begining of String
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
      // select: false  // means dont send this sensitive data to client
    },
    startDates: [Date]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// There is somthing call virtual properties, it was not persisted in the database so we
// can not query using this properties. It was added after data has taken from DB.
tourSchema.virtual('durationWeeks').get(function() {
  // Can not use arrow function because it was inaccessible to 'this' keyword
  return this.duration / 7; // this point to current document
});

// DOCUMENT MIDDLEWARE
// Run before save(), create() not insertOne/Many()
tourSchema.pre('save', function(next) {
  // HOOKS or Middlewares is the name of middleware in Mongoose
  // 'this' points to current processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   // 'this' points to current processed document
//   console.log('Will save this document');
//   next();
// });

// // After saving
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
// 'find' only works for find() not findOne(), so to aplly to all finding method we use RegEx
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); // 'this' points to query obj. That's why we can chain find()

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  // Do something here, 'this' points to query obj like pre() above
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // this.pipiline() returns [] in aggregate([])
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const Tour = mongoose.model('Tour', tourSchema); // 'Tour' specify tour collection in Mongo

module.exports = Tour;
