const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRouter');
const router = express.Router();

// router.param('id', tourController.checkId)

router.use('/:tourId/reviews', reviewRouter)

router
    .route('/')
    .get(authController.protect ,tourController.getAllTours)
    .post(tourController.createTour)
    // .post(tourController.checkBody ,tourController.createTour)

router
    .route('/:id')
    .get(tourController.getOneTour)
    .patch(tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour)

// router
//     .route('/:tourId/reviews')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     );

module.exports = router;