var mongoose = require('mongoose');
var paymentSchema = new mongoose.Schema({
    paymentNumber: { type : String },
    paymentDataBanker : { type: String },
    paymentDataBuyer : { type:String},
    orderNumber: { type : String },
	seller: { type : String },
    buyer: { type : String },
    banker: { type : String },
    invoiceNumber : { type : String}, 
    amount: { type : Number },
    utrNumber: { type : String},
	statusCode: { type : Number },
	statusMessage: { type : String }
});

module.exports = mongoose.model('Payment', paymentSchema);