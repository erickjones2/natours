const dotenv = require('dotenv');
const mongoose = require('mongoose');

// GLOBAL HANDLER FOR APP
// Uncaught Exception is bugs, programming errors
// like console.log(xxx) when xxx was not defined
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION. Server is shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const connectionString = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to remote Atlas MongoDB Server'));

console.log(`env: ${process.env.NODE_ENV}`);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Natours is running on port ${port}...`);
});

// GLOBAL HANDLER FOR APP
// Unhandled promise rejection: when rejected promise was not handled like mongoose.connect().then()
// without catch()
// This global handler promise rejection (using event listener)
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION. Server is shutting down...');

  // Real-world code.
  // If there are some requests are pending, server.close() serves all last request-respon after
  // actually closing app with process.exit(1)
  server.close(() => {
    process.exit(1);
  });
});

// Set up specific Heroku feature
// SIGTERM is signal from Heroku to force reset our app to keep app fresh after 24 hours
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down...');
  server.close(() => {
    console.log('Process terminated !');
  });
});
