const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    name : {
        type: String,
        reruired: true,
        unique: true,
        trim: true
    }, 
    duration : {
        type: Number,
        required: [true, 'Tour Must have durations']
    },
    maxGroupSize : {
        type: Number,
        required: [true, 'Tour Must have groupSize']
    },
    difficulty : {
        type: String,
        required: [true, 'Tour Must have difficulty']
    },
    ratingsAverege : {
        type: Number,
        default: 4.5
    }, 
    ratingsQuantity: {
        type: Number,
        default: 0
    }, 
    price: {
        type: Number,
        required: [true, 'Price Must Required']
    },
    priceDiscount : Number,
    summary : {
        type: String,
        trim: true,
        required: [true, 'Tour Must have summary']
    },
    description : {
        type: String,
        trim: true,
    }, 
    imageCover : {
        type: String,
        required: [true, 'Tour Must have imageCover']
    }, 
    images: [String],
    createdAt : {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates : [Date],
    // {
    //     toJSON: { virtuals: true},
    //     toObject: { virtuals: true }
    // },
    startLocation : {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations : [
    {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }
],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]  
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, { lower: true });
    next(); 
})

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
        
    next();
})

// tourSchema.pre('save', async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;