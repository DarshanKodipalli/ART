var mongoose = require('mongoose');
var invoiceInterfaceSchema = new mongoose.Schema({
	invoiceNumber: { type : String },
	seller: { type : String },
	buyer: { type : String },
	banker: { type : String },
	invoiceDescription: { type : String },
	amount: { type : Number },
	statusCode: { type : Number },
	statusMessage: { type : String },
	orderNumber : { type : String}
});

module.exports = mongoose.model('InvoiceInterface', invoiceInterfaceSchema);