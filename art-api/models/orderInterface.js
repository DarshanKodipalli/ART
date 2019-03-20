var mongoose = require('mongoose');
var orderInterfaceSchema = new mongoose.Schema({
	orderNumber: { type : String },
	seller: { type : String },
	buyer: { type : String },
	banker: { type : String },
	items: { type : [] },
	amount: { type : Number },
	statusCode: { type : Number },
	statusMessage: { type : String }
});

module.exports = mongoose.model('OrderInterface', orderInterfaceSchema);