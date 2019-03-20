var mongoose = require('mongoose');
var invoiceSchema = new mongoose.Schema({
	invoiceData : {type:String},
	invoiceDataHashKey: {type:String},
	invoiceNumber: { type : String },
	seller: { type : String },
	buyer: { type : String },
	banker: { type : String },
	buyerchecker: { type : String },
	sellerchecker: { type : String },
	invoiceDescription: { type : String },
	amount: { type : Number },
	sellerPaymentStatus: { type: Boolean },
	bankerAmountPaidToSeller: { type : Number },
	bankerPaymentStatus: { type : Boolean },
	buyerAmountPaidToBanker: { type : Number },
	statusCode: { type : Number },
	statusMessage: { type : String },
	orderNumber : { type : String}
});

module.exports = mongoose.model('Invoice', invoiceSchema);