const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  // const nameDuplicated = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const valueDuplicated = err.keyValue.name;
  const fieldsDuplicated = Object.keys(err.keyValue);

  const message = `Duplicated fields '${fieldsDuplicated}' with values '${valueDuplicated}': Please use another value !`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errorStats = err.message;
  const message = `Invalid input data: ${errorStats}`;

  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  return new AppError('Invalid token, please try again !', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('Expired token, please try again !', 401);
};

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    stack: err.stack,
    message: err.message,
    error: err
  });
};

const sendErrProd = (err, res) => {
  //  Operational error, trusted error, send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or unkown error, dont leak error details
    // 1. Log err
    console.error('ERROR ERROR ERROR !', err);

    // 2. Send generic message,
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong !'
    });
  }
};

module.exports = (err, req, res, next) => {
  // Middleware with 4 agrs automatically known as 'global Error handling' by Express.
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Difference logs between development and production
  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    // Errors from Mongo does not recognised as Operational error, so we need to spectify it
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateErrorDB(error);
    }

    // Errors from Mongo, validation errors
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }

    sendErrProd(error, res);
  }
};
