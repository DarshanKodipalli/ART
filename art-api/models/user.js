var mongoose = require('mongoose'),
    SALT_WORK_FACTOR = 15,
    bcrypt = require('bcryptjs');

// Add other fields similar to users in blockchain based on the requirement.

var userSchema = new mongoose.Schema({
	email: { type : String, required: true, trim: true },
	username: { type : String, required: true, trim: true },
    password: { type : String, required: true, trim: true },
	role: { type: String, required: true, trim: true },
    verifiedUser: { type : Boolean },
    emailVerification : { type : Boolean },
    firstName : { type : String },
    middleName : { type : String },
    lastName : { type : String },
    companyName : { type : String },
    companyTicker : { type : String },
    position : { type : String },
    cinNumber : { type : String },
    companyType : { type : String },
    addressLine1 : { type : String },
    addressLine2 : { type : String },
    addressLine3 : { type : String },
    maxlimit : { type : Number },
    checker: { type: String },
    seller: { type : String },
	buyer: { type : String },
    banker: { type : String },
    buyerchecker: { type : String },
    sellerchecker: { type : String }
});

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);