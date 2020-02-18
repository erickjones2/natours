// Everything in Express was middlewares to handle req --> res cycle

const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandller = require('./controllers/errorController');

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

// If there is no middleware was matched and run above, this is the final middlewares in req-res-cycle
// Therefore, it will handle all route was not declared.
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server !`);
  // err.statusCode = 404;
  // err.status = 'fail';

  //next(err); //next(agr) with 1 agr will automatically run global Error handling by Express
  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});

// Global Error handling by Express
// globalErrorHandller: Middleware with 4 agrs automatically known as 'global Error handling' by Express.
app.use(globalErrorHandller);

module.exports = app;
