const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const {promisify} = require('util')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appErrors')
const Email = require('../utils/email')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user,statusCode, res)=> {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires : new Date(Date.now() + process.env.JWT_EXPIRES_COOKIE * 24 * 60 * 60 * 1000),
        httpOnly : true
    })

    user.password = undefined;

    res.status(statusCode).json({
        status : 'success',
        token,
        data: {
            user
        }
    });
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();    

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    //Check if Email and password Exists
    if(!email || !password){
        next(new AppError('Please provide Email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    //Check if User exists then password is correct
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect Email or Password', 401));
    }

    console.log(user);

    //Send Token to client
    createSendToken(user, 201, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        return next(new AppError('You are not logged in! Please login first', 401))
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError('The user belonging to this token does no longer exists.', 401))
    }

    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User changed password...please login again', 401))
    }

    req.user = freshUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next)=> {
        if(!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission for perfoming this action',403)
            )
        }
        next();
    };
}

exports.forgotPassword = catchAsync(async(req, res, next) => {
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new AppError('There is no user with this email...', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Password confirm to : ${resetURL}.`

    try{
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token(valid till 10 mins)',
        //     message
        // });
    
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email !'
        })
    }
    catch{
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error in sending email...'),500)
    }   
});

exports.resetPassword = catchAsync(async(req, res, next) => {

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    console.log(hashedToken);

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    console.log(user);

    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req,res,next)=> {
    // Get User From DataBase
    const user = await User.findById(req.user.id).select('+password');

    // Check if Posted Current password is correct 
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your Current Password is wrong', 401));
    }

    // If Correct then update the password
    user.password = req.body.passwordCurrent;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // Send the JWT Token
    createSendToken(user, 201, res);
})