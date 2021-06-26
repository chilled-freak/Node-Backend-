const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        reruired: [true, 'Name Must be required']
    },
    email : {
        type: String,
        required: [true, 'Email Must be required'], 
        unique: true,
        lowerCase: true,
        validate: [validator.isEmail, 'Please provide valid Email']

    },
    photo : {
        type: String,
        default: 'default.jpg'  
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guide', 'lead-guide'],
        default: 'user'
    },
    password : {
        type: String,
        required: [true, 'Password Must be required'],
        minlength: 8,
        select: false
    },
    passwordConfirm :  {
        type: String,
        required: [true, 'Confirm Password Must be required'],
        validate: {
            validator: function(el) { 
                return el === this.password;
            },
            message: 'Password not matched'
        }
    },
    passwordChangedAt : Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
 
    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
})

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}});

    next();
})

userSchema.methods.correctPassword = function(candidatePassword, userPassword){
    return bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000,10);
        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;