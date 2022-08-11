const express = require('express');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');

app.use('/api/v1/users', userRouter);

app.get('/', (req, res) => {
  res.status(200).send('API is running on port 5000')
})

app.get('*', (req, res) => {
  console.log('Here we are');
})

app.all('*', (req, res, next) => {
  next(
    new AppError(`The page ${req.originalUrl} was not found on the server`, 404)
  );
});

app.use(globalErrorHandler);

module.exports = app;
