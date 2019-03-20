var mongoose = require('mongoose');
var kycSchema = new mongoose.Schema({
    kycID: { type : String },
    aadhaarCardNumber: { type : String },
    panCardNumber: { type : String },
    cinNumber: { type : String },
    document1Hash: { type : String },
    document2Hash: { type : String },
	seller: { type : String },
	buyer: { type : String },
	banker: { type : String }
});

module.exports = mongoose.model('Kyc', kycSchema);