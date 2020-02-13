const dotenv = require('dotenv');
const mongoose = require('mongoose');

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
  .then(() => console.log('Connected to remote Atlas MongoDB'));

console.log(`env: ${process.env.NODE_ENV}`);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Natours is running on port ${port}...`);
});
