// Everything in Express was middlewares to handle req --> res cycle

const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
app.use(express.static(`${__dirname}/public`));

app.use(express.json()); // using middleware and for req.bodys

app.use((req, res, next) => {
  //create our own middleware
  console.log('Req, Res went through this Mid-ware !');
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ROUTES
app.use('/api/v1/tours', tourRouter); //tourRouter like sub application
app.use('/api/v1/users', userRouter); //userRouter like sub application

module.exports = app;
