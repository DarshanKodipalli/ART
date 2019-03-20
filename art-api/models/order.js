var mongoose = require('mongoose');
var utils = require('../utils/core');

var orderSchema = new mongoose.Schema({
	orderNumber: { type : String },
	seller: { type : String },
	buyer: { type : String },
	banker: { type : String },
	buyerchecker: { type : String },
	sellerchecker: { type : String },
	items: { type : [] },
	amount: { type : Number },
	statusCode: { type : Number },
	statusMessage: { type : String }
});

// transactionHash: { type : String }

// include createdDate, updatedDate,createduser,maintuser

/*
var orderSchema = new mongoose.Schema({
	orderNumber: { type : String },
	status: { type : String },
	orderFilePath: { type : String, required: true, trim: true },
	transactionHash: { type : String }
});
*/


module.exports = mongoose.model('Order', orderSchema);