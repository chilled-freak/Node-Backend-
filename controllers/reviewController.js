const Review = require('./../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const handler = require('./handlerFactory')

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if(req.params.tourId) filter = { tour: req.params.tourId }    

    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'Success',
        dataLenght: reviews.length,
        data: {
            reviews
        }
    })
})

exports.setTourUserIds = (req, res, next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next(); 
};

// exports.createReview = catchAsync(async (req, res, next) => {    

//     const newReview = await Review.create(req.body);

//     res.status(200).json({
//         status: 'Success',
//         data: {
//             review: newReview
//         }
//     })
// })
exports.getOneReview = handler.getOne(Review);
exports.createReview = handler.createOne(Review);
exports.updateReview = handler.updateOne(Review);
exports.deleteReview = handler.deleteOne(Review);