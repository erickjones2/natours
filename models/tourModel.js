// Quote: "FAT MODEL, THIN CONTROLLER"

const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator'); // npm package for validator

// const User = require('./../models/userModel');
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
      // validate: [validator.isAlpha, 'Tour name only contains characters'] //validator.js
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
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // Run when new value was set
      // round(4,66666) = 5 => not good
      // round(4,66666 * 10) ~ round(46,6666) = 47 / 10 = 4.7 => good
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        // Custom validator
        validator: function(val) {
          // 'this' points to current doc
          return this.price > val;
        },
        message: 'Discount price ({VALUE}) must be lower than regular price !'
      }
    },
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
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // Embeded location
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// INDEXES IN MONGO
// INDEXES: actually creating a ordered list of provided fields(like 'price', 'slug'...) in DB.
// When we query this fields in DB, it's much faster because it was listed in ascend or descend order.
// Improve performance of query(in searching)
// Don't indexs all fields, because. When saving new doc, indexes will be recreated => cost CPU.
// Chose fields wisely to index

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); // Compound indexes
tourSchema.index({ slug: 1 });

// To use geospatial queries, we need to index fields that contained location
tourSchema.index({ startLocation: '2dsphere' });

// There is somthing call virtual properties, it was not persisted in the database so we
// can not query using this properties. It was added after data has taken from DB.
tourSchema.virtual('durationWeeks').get(function() {
  // Can not use arrow function because it was inaccessible to 'this' keyword
  return this.duration / 7; // this point to current document
});

// "VIRTUAL POPULATE"
// Because of using parent reference, only Review knows it belongs to its Tour, but Tour doesn't
// how much Review it owns. To fix it, there are 2 solutions.
// 1. Using child reference, but it will lead to a a lot of ObjectId of Review in Tour.reviews(not a
// good practice). Ignore !
// 2. Using "Virtual populate". The chosen one below
tourSchema.virtual('reviews', {
  ref: 'Review', // Collection want to reference
  foreignField: 'tour', // Foreign field in Review want to reference
  localField: '_id' // Field in current collection(Tour) want to reference
});

// DOCUMENT MIDDLEWARE
// Run before save(), create() not insertOne/Many()
// Run between taking data and saving data
tourSchema.pre('save', function(next) {
  // HOOKS or Middlewares is the name of middleware in Mongoose
  // 'this' points to current processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// This code for embedding User (guide) to Tour, but not the good idea
// tourSchema.pre('save', async function(next) {
//   // Every iteration, map() asign value returned from callback function to guidePromises.
//   // So guidePromises is array of Promises
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   const guides = await Promise.all(guidesPromises);
//   this.guides = guides;

//   next();
// });

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

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  // Do something here, 'this' points to query obj like pre() above
  next();
});

// // AGGREGATION MIDDLEWARE
// // Checking secretTour in aggregate()
// tourSchema.pre('aggregate', function(next) {
//   // this.pipiline() returns [] in aggregate([])
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // 'Tour' specify tour collection in Mongo

module.exports = Tour;
