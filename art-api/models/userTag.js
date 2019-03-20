var mongoose = require('mongoose');

var userTagSchema = new mongoose.Schema({
    buyer: { type : String, required: true, trim: true },
    seller: { type : String, required: true, trim: true },
    enddate: { type : String, default: null },
    active: { type : Boolean, default: true }
});

module.exports = mongoose.model('UserTag', userTagSchema);