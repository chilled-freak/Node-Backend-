const path = require('path');
const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appErrors')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRouter')
const userRouter = require('./routes/userRouter')
const reviewRouter = require('./routes/reviewRouter')
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

// Global Middlewares

// Serving Static Data
app.use(express.static(path.join(__dirname, 'public')));

// Request Limit Middlware

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, Please try again after 1 Hour...'
})
app.use('/api', limiter);

// HTTP Middlware
app.use(helmet());

// Read Data from request body
app.use(express.json());

app.use(mongoSanitize());
// app.use(xss());
// app.use(hpp());
app.use(morgan('dev')); // Third-party Middleware

// Test Middlwares
app.use((req, res, next) => {
    console.log("Hello From Middleware");
    next();
})

app.use(compression());

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

app.get('/', (req, res) =>{
    res.status(200).render('base');
})

//Routes

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req,res,next) => {
    // res.status(404).json({        
    //     status: 'failed',
    //     message: `can't find ${req.originalUrl} on this server!`,
    // })

    // const err = new Error(`can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler)

module.exports = app;

