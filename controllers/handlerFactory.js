const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appErrors')

exports.createOne = Model => catchAsync(async (req, res, next)=> {
    // try {
        const doc = await Model.create(req.body);

        res.status(200).json({
            status : "Success",
            data: {
                data : doc
            }
        })
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next)=> {

       let query = Model.findById(req.params.id);
       if(popOptions) query = query.populate(popOptions);

        const doc = await query;

        if(!doc){
            return next(new AppError('No document available on this ID', 404));
        }
    
        res.status(200).json(
            {
                message: 'success',
                data : {
                   data: doc
                }
            });       
});

exports.updateOne = Model => catchAsync(async (req, res, next)=> {
    // try {
    const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json(
        {
            message: 'success',
            data : {
                data 
            }
        });
});

exports.deleteOne = Model => catchAsync(async(req, res,next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if(!doc){
        return next(new AppError('There is no document with this Id', 404));
    }

    res.status(204).json({
        message: 'Deleted Successfully',
        data : 'null'
    });
})

