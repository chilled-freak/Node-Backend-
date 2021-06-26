const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErrors')
const handler = require('../controllers/handlerFactory')

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkId = (req, res, next, val) => {
//     const id = req.params.id * 1;
//     console.log(`id is ${val}`);
//     if(id > tours.length){
//         return res.status(404).json(
//             {
//                 status: 'failed',
//                 message: 'Invalid ID'
//             });
//     }
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json(
//             {
//                 status: 'failed',
//                 message: 'Missing name and price'
//             });
//     }
//     next();
// }

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }
    else {
        cb(new AppError('Please Upload an image', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxXount: 1},
    {name: 'images', maxCount: 3}
]);

exports.resizeTourImages = catchAsync(async(req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();

    //CoverImage
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/tours/${req.body.imageCover}`);

    //Images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

            await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    )
    next();
});

exports.getAllTours = catchAsync(async (req, res, next)=> {
    // try {
        //Basic Filtering
        const queryObj = { ...req.query };
        const excludeFields = ['page', 'limit', 'sort', 'fields'];
        excludeFields.forEach(el => delete queryObj[el]);

        //Advance Filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        console.log(JSON.parse(queryStr));
 
        let newQuery = Tour.find(JSON.parse(queryStr));

        //Sorting
        if(req.query.sort){
            let sortBy = req.query.sort.split(',').join(' ');
            newQuery = newQuery.sort(sortBy);
        } else {
            newQuery = newQuery.sort('-createdAt');
        }

        //Field Limting
        if(req.query.fields){
            let fields = req.query.fields.split(',').join(' ');
            newQuery = newQuery.select(fields);
        } else {
            newQuery = newQuery.select('-__v');
        }

        //Pagination
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;
        const skip = (page - 1) * limit;

        newQuery = newQuery.skip(skip).limit(limit);

        if(req.query.page){
            const newPage = await Tour.countDocuments();
            if(skip >= newPage) throw new Error('This Page does not exists');
        }

        const tours = await newQuery;
     
        res.status(200).json(
            {
                message: 'success',
                results: tours.length,
                data : {
                    tours
                }
            });
    //   }                                     
        // catch (err){
        //     res.status(404).json({
        //         status : "failed", 
        //         message : err
        //     })
        // }   
});

// exports.getOneTour = catchAsync(async (req, res, next)=> {
//     // try {
//         const tours = await Tour.findById(req.params.id).populate('reviews');
//         if(!tours){
//             return next(new AppError('There is no available id', 404));
//         }
    
//         res.status(200).json(
//             {
//                 message: 'success',
//                 results: tours.length,
//                 data : {
//                     tours
//                 }
//             });
//     //   }
//     //   catch (err){
//     //     res.status(404).json({
//     //         status : "failed", 
//     //         message : err
//     //     })
//     //   }   
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//     // try {
//     const newTour = await Tour.create(req.body);

//     res.status(200).json({
//         status : "Success",
//         data: {
//             tour : newTour
//         }
//     })
// //   }
// //   catch (err){
// //     res.status(404).json({
// //         status : "failed", 
// //         message : err
// //     })
// //   }
// });

// exports.updateTour = catchAsync(async (req, res, next)=> {
//     // try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     })

//     res.status(200).json(
//         {
//             message: 'success',
//             data : {
//                 tour 
//             }
//         });
//     // }
//     // catch (err){
//     //     res.status(404).json({
//     //         status : "failed", 
//     //         message : err
//     //     })
//     //   }
// });

exports.getOneTour = handler.getOne(Tour, { path: 'reviews' });

exports.createTour = handler.createOne(Tour);

exports.updateTour = handler.updateOne(Tour);

exports.deleteTour = handler.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next)=> {
//     // try {
//         await Tour.findByIdAndDelete(req.params.id)

//     res.status(204).json({
//         message: 'Deleted Successfully',
//         data : 'null'
//     });
//     // }
//     // catch (err){
//     //     res.status(404).json({
//     //         status : "failed", 
//     //         message : err
//     //     })
//     // }
// });

exports.getTourStats = catchAsync(async (req, res, next)=> {
    // try {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: { $gte: 4.5}}
            }
    ])   
    // }
    // catch (err){
    //     res.status(404).json({
    //         status : "failed", 
    //         message : err
    //     })
    // }
});