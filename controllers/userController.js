const multer = require('multer');
const User = require('./../models/userModel');
const sharp = require('sharp');
const CatchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appErrors');
const handler = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },

//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

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

const filterObj = (obj, ...allowedFileds) => {
    const newObj = {};

    Object.keys(obj).forEach(el => {
        if(allowedFileds.includes(el)) newObj[el] = obj[el];
    });
    return newObj; 
}

exports.uploadImage = upload.single('photo');

exports.resizeImage = CatchAsync(async(req, res, next) => {
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.file.filename}`);

    next();
});

exports.getAllUsers = CatchAsync(async (req, res)=> {

    const users = await User.find();

    res.status(200).json(
        {
            status: 'success',
            usersLength: users.length,
            data: {
                users
            }
        });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = CatchAsync(async (req, res, next) => {
    console.log(req.file);
    console.log(req.body);  

    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This Route is not for update password', 400))
    }

    const filterBody = filterObj(req.body, 'name', 'email')
    if(req.file) filterBody.photo = req.file.filename;

    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'Success',
        user: updateUser
    })
});

exports.deleteMe = CatchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.getOneUser = handler.getOne(User);

exports.createUser = (req, res) => {
    res.status(200).json(
        {
            status: 'error',
            message: 'please use signup instead!!'
        });
}

// exports.updateUser = (req, res)=> {
//     res.status(200).json(
//         {
//             status: 'error',
//             message: 'Route is not yet defined'
//         });
// }

// exports.createUser = handler.createOne(User);
exports.updateUser = handler.updateOne(User);
exports.deleteUser = handler.deleteOne(User);

// exports.deleteUser = (req, res)=> {
//     res.status(200).json(
//         {
//             status: 'error',
//             message: 'Route is not yet defined'
//         });
// }