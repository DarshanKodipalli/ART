var Invoice = require('../models/invoice');
var Order = require('../models/order');
var config = require('../config/sysProp');
var base64 = require("base64-stream");
var utils = require("../utils/bulkUpload");
var coreutils = require("../utils/core");
var Log = require('../controllers/transactionCtrl');
var	PDFDocument = require('pdfkit');
var	blobStream = require('blob-stream');
var	fs = require('fs');
const shell = require('shelljs');
const exec = require('child_process').exec;
var path = require('path');
var multer  =   require('multer');

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './signatures');
  	console.log("in Storage")
  	console.log(req)
  	console.log("_______________")
  	console.log(file)
  },
  filename: function (req, file, callback) {
  	console.log("in Storage")
  	console.log(req)
  	console.log("_______________")
  	console.log(file)
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

const namespace = "io.aeries.art.order";

var invoiceStatus = require('../utils/core').invoiceStatus;

// POST /invoices/carts (Create Invoice by seller)
exports.createInvoice = async function (req, res) {

	if(req.session.user.role !== 'seller'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	var invoice = new Invoice();

	invoice.statusCode = invoiceStatus.Created.code;
	invoice.statusMessage = invoiceStatus.Created.text;
	console.log(req.body);
	if (!req.body.sendDirectly) {
		let order = await Order.findOne({ orderNumber: req.body.orderNumber });
		console.log("Order" + order);
		if (order) {
			// check order status
			// if order is not approved validation
			if (order.amount) {
				invoice.amount = order.amount;
			} else {
				invoice.amount = 0;
			}
			invoice.buyer = order.buyer;
		} else {
			return res.json({ "error": "order record not found" });
		}
	} else {
		invoice.amount = req.body.amount || 0;
		// check for buyer existance in buyer to seller list
		invoice.buyer = req.body.buyer;
	}

	if (config.makerCheckerEnabled) {
		if (req.session.user.buyerchecker) {
			invoice.buyerchecker = req.session.user.buyerchecker;
		}
		if (req.session.user.sellerchecker) {
			invoice.sellerchecker = req.session.user.sellerchecker;
		}
	}


	invoice.orderNumber = req.body.orderNumber || '';
	invoice.invoiceDescription = req.body.invoiceDescription || '';

	invoice.seller = req.session.user.email;
	invoice.banker = config.banker;

	try {
		let updatedInvoice = await invoice.save();
		console.log("_______________")
		console.log(updatedInvoice);
		console.log("_______________")
		if (updatedInvoice) {
			let result = await bcUpsertInvoice(req.session.user.email, updatedInvoice);
			let transactionId = JSON.parse(result).transactionId;
			console.log("Hash is " + transactionId);

			let id = updatedInvoice._id;
			console.log("Id is " + id);
			let invoiceNumberData = await bcGetInvoiceNumberById(req.session.user.email, id);
			console.log("Invoice Number data" + JSON.stringify(invoiceNumberData));
			// check for length validation
			console.log(invoiceNumberData[0].invoiceNumber);
			// updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
			updatedInvoice.invoiceNumber = invoiceNumberData[0].invoiceNumber;
			await updatedInvoice.save();
			await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'UpsertInvoice', 'Invoice Created', req.session.user.email,
				req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller,
				req.session.user.buyerchecker, req.session.user.sellerchecker, updatedInvoice.banker, transactionId);
			// if result returns invoiceNumber/transactionHash update the database
			return res.json({ message: 'Invoice Added', 'transactionHash': transactionId, 'invoiceNumber': updatedInvoice.invoiceNumber });
		}
	} catch (err) {
		return res.send(err);
	}

};
exports.searchForInvoices = async function(req,res){
    console.log(req.body);
    var query = {};
    if(req.body.invoiceId){
        query.invoiceNumber = req.body.invoiceId;
    }if(req.body.orderId){
        query.orderNumber = req.body.orderId;
    }if(req.body.buyerId){
        query.buyer = req.body.buyerId;    	
    }
    console.log(query);
    let invoice = await Invoice.find(query);
    if(invoice){
/*        console.log(invoice);*/
        res.json(invoice);
    }else{
        res.json({status : -1})
    }
}

// PUT /invoices/carts/:id (Update Invoice by seller)
exports.updateInvoice = async function (req, res) {
	// console.log("Update");
	if(req.session.user.role !== 'buyer'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	let invoiceNumber = req.params.id;
	// validation for inputs

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });

		if (invoice) {

			invoice.statusCode = invoiceStatus.Updated.code;
			invoice.statusMessage = invoiceStatus.Updated.text;
			invoice.seller = req.session.user.email;
			if (config.orderDependencyEnabled) {
				var order = await Order.findOne({ orderNumber: req.body.orderNumber });
				if (order) {
					if (order.amount) {
						invoice.amount = order.amount;
					} else {
						invoice.amount = 0;
					}
					invoice.buyer = order.buyer;
					invoice.orderNumber = order.orderNumber;
				} else {
					return res.json({ "errror": "order not found" });
				}
			} else {
				// check buyer validity
				invoice.buyer = req.body.buyer || '';
				invoice.amount = req.body.amount || 0;
				invoice.orderNumber = req.body.orderNumber; // outside ART system
			}

			invoice.invoiceNumber = invoiceNumber || '';

			invoice.invoiceDescription = req.body.invoiceDescription || '';


			let updatedInvoice = await invoice.save();
			console.log("Updated Invoice " + updatedInvoice);
			if (updatedInvoice) {
				let result = await bcUpsertInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'UpsertInvoice', 'Invoice Updated', req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller,
					req.session.user.buyerchecker, req.session.user.sellerchecker, updatedInvoice.banker, transactionId);
				return res.json({ message: 'Invoice Updated', 'transactionHash': transactionId });
			}

		} else {
			console.log("Invoice not found");
			return res.json({ "error": "Invoice not found" });
		}

	} catch (err) {
		return res.send(err);
	}
};

// POST /invoices (Submit Invoice by seller)
exports.submitInvoice = async function (req, res) {

	if(req.session.user.role !== 'seller'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	// validation for inputs
	console.log("Submit Invoice")
	try {
		// Make an update call

		//var invoData = JSON.parse(req.body.InvoiceData);
		//console.log(invoData)
		//var invoice = await Invoice.findOne({ invoiceNumber: invoData.id });
		var invoData = JSON.parse(req.body.InvoiceData);
		var invoice = await Invoice.findOne({ invoiceNumber: invoData.id });
		// check if invoice exists
		//console.log("_______________")
		//console.log(req.files)
		//console.log(req.body);
		//console.log(invoice)
		invoice.statusCode = invoiceStatus.Submit.code;
		invoice.statusMessage = invoiceStatus.Submit.text;
		invoice.seller = req.session.user.email;
		console.log(invoice)
		//var base64Invoice = (req.files.files.data || "").toString('base64');
		var base64Invoice = (req.files.files.data||"").toString('base64');
		if (!invoData.sendDirectly) {  //Made a change here.
			console.log(1);
			var order = await Order.findOne({ orderNumber: invoice.orderNumber });
			if (order) {
				console.log(2);
				invoice.buyer = order.buyer;

				if (order.amount) {
					invoice.amount = order.amount;
				} else {
					invoice.amount = 0;
				}
				invoice.orderNumber = order.orderNumber;
			} else {
				return res.json({ "error": "order not found" });
			}
		} else {
			invoice.amount = invoice.amount || 0;
			// check buyer validity
			invoice.buyer = invoice.buyer || '';
		}
		console.log(3);
		//invoice.invoiceData = base64Invoice;
		invoice.invoiceData = base64Invoice;
		//invoice.invoiceDataHashKey = utils.getHash(base64Invoice);
		invoice.invoiceDataHashKey = '';
		invoice.banker = config.banker;
		invoice.invoiceDescription = req.body.invoiceDescription || '';
		console.log("Saving Invoice");
		let updatedInvoice = await invoice.save();
		console.log("Submitting invoice " + updatedInvoice);
		if (updatedInvoice) {
			let result = await bcSubmitInvoice(req.session.user.email, updatedInvoice);
			// if result returns invoiceNumber/transactionHash update the database
			var transactionId = JSON.parse(result).transactionId;
			await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'SubmitInvoice', 'Invoice Submitted', req.session.user.email,
				req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller,
				updatedInvoice.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
			return res.json({ message: 'Invoice Submitted', 'transactionHash': transactionId });
		}

	} catch (err) {
		return res.send(err);
	}
};

exports.viewInvoice = function(request, response) {
	Invoice.findOne({
			invoiceNumber: request.body.invoiceNumber||" "
		})
		.exec(function(err, data) {
			if (err) {
				console.log(err);
				console.log("viewInvoice --error in finding the Invoice");
				response.send(utils.failure);
			} else {
				
				var buf = Buffer.from(data.invoiceData, 'base64');
				response.writeHead(200, {
					'Content-Type': 'application/pdf',
					'Content-disposition': 'attachment;filename=' + data.invoiceNumber + ".pdf",
					'Content-Length': buf.length
				});
				response.end(buf);
			}
		});
	}


// POST /invoices/:id/approvechecker (Approve Invoice by sellerChecker)
exports.approveInvoiceByChecker = async function (req, res) {

	console.log("Inside function");
	if(req.session.user.role !== 'sellerchecker'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	// validation for inputs



	try {
		    var invoiceData = JSON.parse(req.body.checkerApproveData);
  		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceData.id });
		console.log("Finding Invoice");
		console.log(invoiceData)
		if (invoice) {
			invoice.statusCode = invoiceStatus.ApproveChecker.code;
			invoice.statusMessage = invoiceStatus.ApproveChecker.text;

			let updatedInvoice = await invoice.save();
			let invoiceNumber = invoiceData.id;
				console.log("creatingInvoice");
				var doc = new PDFDocument();
				var orderDate = invoiceData.orderNumber.toString() 
				var date1 = orderDate.split("_")[1] || "2019-01-18TNothing"
				console.log(date1);
				var date2 = date1.split("T")[0];
				var invoiceDate = invoiceData.id.toString();
				var date3 = orderDate.split("_")[1];
				console.log(date1);
				var date4 = date1.split("T")[0];
				var stream = doc.pipe(blobStream());
				console.log(req.files.files)


				doc.pipe(fs.createWriteStream('Invoice-' + invoiceData.id + '.pdf'));// todo

				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(20)
					.fillColor('black')
					.text("Aeries Blockchain Corporation", 10, 35);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("Prestige Groups", 10, 85)
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("https://aeries.io/", 10, 65);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("Kadubisinahalli, Bengaluru", 10, 105);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("560087", 10, 125);

				doc.image('./aeries.jpeg', 400, 50);

				doc.font('Times-Roman')
					.fontSize(28)
					.fillColor('black')
					.text("Invoice", 260, 200);

				doc.lineWidth(2)
				doc.moveTo(20,250)
					.lineTo(600,250)	
					.stroke()

				doc.font('fonts/Merriweather-Regular.ttf')
					.fontSize(18)
					.fillColor('black')
					.text("Bill to:", 40, 265);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("Unilever Global Company", 40, 305);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text("buyer1@aeries.io", 40, 325);

				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Order   #:", 230, 305);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(invoiceData.orderNumber, 330, 305);

				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Created  :", 230, 325);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(date2, 330, 325);

					doc.lineWidth(2)
					doc.moveTo(100,370)
					   .lineTo(500,370)
					   .stroke()

				doc.font('fonts/Merriweather-Regular.ttf')
					.fontSize(18)
					.fillColor('black')
					.text("Invoice Details:", 40, 400);
				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Seller  :", 40, 440);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(updatedInvoice.seller, 100, 440);

				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Banker  :", 40, 460);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(updatedInvoice.banker, 100, 460);

				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Invoice #:", 230, 440);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(invoiceNumber, 330, 440);

				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Created  :", 230, 460);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(14)
					.fillColor('black')
					.text(date4, 330, 460);

					doc.lineWidth(2)
					doc.moveTo(20,510)
					   .lineTo(600,510)
					   .stroke()

				doc.font('Times-Roman')
					.fontSize(20)
					.fillColor('black')
					.text("Total Invoice Amount:", 140, 560);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(22)
					.fillColor('black')
					.text("Rs. " + updatedInvoice.amount, 400, 560);


				doc.font('Times-Roman')
					.fontSize(14)
					.fillColor('black')
					.text("Terms and Instructions:", 10, 660);
				doc.lineWidth(1)
				doc.moveTo(10,680)
				   .lineTo(220,680)
				   .fillColor('light-grey')
				   .stroke()
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(12)
					.fillColor('black')
					.text('Please make the payment within the due date', 15, 690);
				doc.font('Times-Roman', 'Chalkboard-Bold')
					.fontSize(12)
					.fillColor('black')
					.text('Installed products have a warranty of 5 years', 15, 705);

				doc.font('Helvetica-Bold')
					.fontSize(12)
					.fillColor('black')
					.text('Invoice Manager, Aeries Technologies', 320, 705);

				doc.end();					
				console.log("Invoice Created");
				var cmd = 'mvn exec:java -Dexec.mainClass="signature.CreateVisibleSignature" -Dexec.args="./praveen1.p12 password ./'+'Invoice - ' + invoiceNumber + '.pdf'+' ./sign2.jpg"';
				var shellScriptPath = "./digitalSignature.sh "+'Invoice-' + invoiceData.id + '.pdf image.jpg';
				console.log(shellScriptPath)
				const execscript = exec('sh digitalSignature.sh '+'Invoice-' + invoiceData.id + '.pdf image.jpg');
				execscript.stdout.on('data',function(data){
					console.log(data)
				})
				execscript.stderr.on('data',function(data){
					console.log("error")
					console.log(data)
				})				
				fs.writeFile('image.jpg', req.files.files.data, {encoding: 'base64'}, function(err) {
  			    console.log(err)
			    console.log('File created');


				})
					if (updatedInvoice) {
						let result = await bcApproveInvoiceByChecker(req.session.user.email, updatedInvoice);
						// if result returns invoiceNumber/transactionHash update the database
						var transactionId = JSON.parse(result).transactionId;
						await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'InvoiceApproval', 'Invoice Approval By Checker', req.session.user.email,
							req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
							req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
						return res.json({ message: 'Invoice Approved By Checker', 'transactionHash': transactionId });
					}

	}else{

	}
} 
catch(err){
	console.log(err)
}

};

// POST /invoices/:id/cancel (Submit Invoice by seller)
exports.cancelInvoice = async function (req, res) {
	if(req.session.user.role !== 'seller'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	console.log("Inside function");
	// validation for inputs
	let invoiceNumber = req.params.id;

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice");
		if (invoice) {
			invoice.statusCode = invoiceStatus.Approve.code;
			invoice.statusMessage = invoiceStatus.Approve.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcCancelInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'CancelInvoice', 'Invoice Cancelled', req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Invoice Cancelled', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({"success":"fail", "message":"Invoice record not found"});
		}

	} catch (err) {
		return res.send(err);
	}
};

// POST /invoices/:id/reject (Reject Invoice by buyer)
exports.rejectApproveInvoice = async function (req, res) {
	if(req.session.user.role !== 'buyer'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	console.log("Inside function");
	// validation for inputs
	let invoiceNumber = req.params.id;

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice");
		if (invoice) {
			invoice.statusCode = invoiceStatus.Approve.code;
			invoice.statusMessage = invoiceStatus.Approve.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcRejectApproveInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'RejectInvoiceApproval', 'Reject Invoice Approval', req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Reject Invoice Approved', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({"success":"fail", "message":"Invoice record not found"});
		}

	} catch (err) {
		return res.send(err);
	}
};

// POST /invoices/:id/approve (Approve Invoice by buyer)
exports.approveInvoice = async function (req, res) {
	if(req.session.user.role !== 'buyer'){
		return res.json({"success":"fail","message":"Not Authorized"});
	}
	let invoiceNumber = req.params.id;

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice");
		if (invoice) {
			invoice.statusCode = invoiceStatus.Approve.code;
			invoice.statusMessage = invoiceStatus.Approve.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcApproveInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'InvoiceApproval', 'Invoice Approval', req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Invoice Approved', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({"success":"fail", "message":"Invoice record not found"});
		}

	} catch (err) {
		return res.send(err);
	}
};

exports.getAllInvoices = async function (req, res) {
	var role = req.session.user.role;
	console.log(role)
	var invoices = await getInvoices(req.session.user.email); // Gets only invoices of owner
	if(config.dataEncryptionEnabled && role !== 'auditor') {
		coreutils.decrypt(invoices, 'invoice');
	}
	return res.json({ 'message': 'Invoices List', 'invoices': invoices });
};

exports.getAllCartInvoices = async function (req, res) {
	var invoices = await getCartInvoices(req.session.user.email); // Gets only invoices of owner
	return res.json({ 'message': 'Invoices Cart List', 'invoices': invoices });
};

// POST /invoices/:id/propose (Propose Invoice by Buyer or Seller)
exports.proposeInvoice = async function (req, res) {
	
	console.log("Inside function");
	// validation for inputs
	let invoiceNumber = req.params.id;
	let role;
	if (req.session.user.role == 'buyer') {
		role = 'buyer';
	} else if (req.session.user.role == 'seller') {
		role = 'seller';
	} else {
		return res.json({ "message": "Not valid user. Please contact Admin." })
	}

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice" + JSON.stringify(invoice));
		// validate for Approved record
		if (invoice) {
			if (invoice.statusCode == invoiceStatus.Propose.code) {
				return res.json({ "message": "Invoice already proposed !." });
			} else if (invoice.statusCode !== invoiceStatus.Approve.code) {
				return res.json({ "message": "Invoice has to be approved !!" })
			}
			invoice.statusCode = invoiceStatus.Propose.code;
			invoice.statusMessage = invoiceStatus.Propose.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcProposeInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				var message;
				if (role == 'buyer') {
					message = 'Invoice Proposal By Buyer';
				} else if (role == 'seller') {
					message = 'Invoice Proposal By Seller';
				}
				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'InvoiceProposal', message, req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Invoice Proposal Done', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({ "error": "Invoice record not found" });
		}

	} catch (err) {
		return res.send(err);
	}
};

// POST /invoices/:id/acceptproposal (Propose Invoice by Buyer or Seller)
exports.acceptProposeInvoice = async function (req, res) {
	if(req.session.user.role !== 'banker'){
		return res.json({ "success":"fail", "message": "Not Authorized." })
	}
	
	console.log("Inside function");
	// validation for inputs
	let invoiceNumber = req.params.id;

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice" + JSON.stringify(invoice));
		// validate for Approved record
		if (invoice) {
			invoice.statusCode = invoiceStatus.AcceptProposal.code;
			invoice.statusMessage = invoiceStatus.AcceptProposal.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcAcceptProposeInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				var message = 'Invoice Proposal accepted by Banker';

				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'InvoiceProposal', message, req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Invoice Proposal Acceptance Done', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({ "error": "Invoice record not found" });
		}

	} catch (err) {
		return res.send(err);
	}
};

// POST /invoices/:id/rejectpropose (Reject Invoice Proposal by Banker)
exports.rejectProposeInvoice = async function (req, res) {
	if(req.session.user.role !== 'banker'){
		return res.json({ "success":"fail", "message": "Not Authorized." })
	}
	console.log("Inside function");
	// validation for inputs
	let invoiceNumber = req.params.id;

	try {
		// Make an update call
		var invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber });
		console.log("Finding Invoice" + JSON.stringify(invoice));
		// validate for Approved record
		if (invoice) {
			invoice.statusCode = invoiceStatus.RejectProposal.code;
			invoice.statusMessage = invoiceStatus.RejectProposal.text;

			let updatedInvoice = await invoice.save();
			console.log(updatedInvoice);
			if (updatedInvoice) {
				let result = await bcRejectProposeInvoice(req.session.user.email, updatedInvoice);
				// if result returns invoiceNumber/transactionHash update the database
				var transactionId = JSON.parse(result).transactionId;
				var message = 'Invoice Proposal Rejected by Banker';

				await Log.transactioncheckerlog(updatedInvoice.invoiceNumber, 'Invoice', 'InvoiceProposal', message, req.session.user.email,
					req.session.user.role, updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker,
					req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				return res.json({ message: 'Invoice Proposal Done', 'transactionHash': transactionId });
			}
		} else {
			console.log("Invoice record not found");
			return res.json({ "error": "Invoice record not found" });
		}

	} catch (err) {
		return res.send(err);
	}
};

exports.viewInvoice = function (request, response) {
	Invoice.findOne({
		invoiceNumber: request.body.invoiceNumber || " "
	})
		.exec(function (err, data) {
			if (err) {
				console.log(err);
				console.log("viewInvoice --error in finding the Invoice");
				response.send(utils.failure);
			} else {

				var buf = Buffer.from(data.invoiceData, 'base64');
				response.writeHead(200, {
					'Content-Type': 'application/pdf',
					'Content-disposition': 'attachment;filename=' + data.invoiceNumber + ".pdf",
					'Content-Length': buf.length
				});
				response.end(buf);
			}
		});
}
exports.invoiceSignedInvoice = function(request,response){
var fileName = 'Invoice-' + request.body.invoiceNumber + '_signed.pdf';
console.log(fileName)
response.sendFile(path.join(__dirname, '../', fileName));
}

/*
	Blockchain Functions
*/

var bcUpsertInvoice = async function (cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "UpsertInvoice";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();
		let transaction = factory.newTransaction(namespace, transactionType);

		let isUpdate = false;
		if (invoice.invoiceNumber) {
			isUpdate = true;
			transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);
		}

		transaction.setPropertyValue('id', invoice._id + '');
		transaction.setPropertyValue('amount', invoice.amount);
		transaction.setPropertyValue('orderNumber', invoice.orderNumber);
		transaction.setPropertyValue('invoiceDescription', invoice.invoiceDescription);

		// check if this buyer exists in users DB
		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		if (isUpdate) {
			console.log("Updated the Invoice : " + invoice.invoiceNumber);
		} else {
			console.log("Saved the Invoice" + invoice);
		}
		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

exports.bcUpsertInvoice = bcUpsertInvoice;

async function bcSubmitInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "SubmitInvoice";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);
		console.log("_______Blockchain________")
		console.log(invoice)
		console.log("_______________")
		transaction.setPropertyValue('id', invoice._id + '');
		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);
		transaction.setPropertyValue('orderNumber', invoice.orderNumber);
		transaction.setPropertyValue('invoiceDescription', invoice.invoiceDescription);
		transaction.setPropertyValue('amount', invoice.amount);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice : " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

async function bcCancelInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "CancelInvoice";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);
		console.log("_______Blockchain________")
		console.log(invoice)
		console.log("_______________")
		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);
		
		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true); 
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Cancelled Invoice : " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

async function bcRejectApproveInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "RejectInvoiceApproval";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Rejected the Invoice Approval: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

async function bcApproveInvoiceByChecker(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "InvoiceApprovalChecker";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice Approval by Checker: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

async function bcApproveInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "InvoiceApproval";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice Approval: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

var bcGetInvoiceNumberById = async function (cardName, id) {
	console.log("Entered into orderbyid");
	let businessNetworkConnection = new BusinessNetworkConnection();
	try {
		await businessNetworkConnection.connect(cardName);
		console.log('Getting ' + cardName + ' invoice based on MongoDB ID');
		return await businessNetworkConnection.query('selectInvoicesById', { id: id });
	} catch (err) {
		console.log(err);
	}
}

exports.bcGetInvoiceNumberById = bcGetInvoiceNumberById;

async function getInvoices(cardName) {
	let businessNetworkConnection = new BusinessNetworkConnection();
	try {
		await businessNetworkConnection.connect(cardName);
		console.log('Getting ' + cardName + ' Invoices');
		return await businessNetworkConnection.query('selectInvoices');
	} catch (err) {
		console.log(error);
	}
}

async function getCartInvoices(cardName) {
	let businessNetworkConnection = new BusinessNetworkConnection();
	try {
		await businessNetworkConnection.connect(cardName);
		console.log('Getting ' + cardName + ' Cart Invoices');
		return await businessNetworkConnection.query('selectCartInvoices');
	} catch (err) {
		console.log(error);
	}
}

// Proposing Invoice by buyer or seller after proposal process
async function bcProposeInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "InvoiceProposal";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice Proposal: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

// Proposing Invoice by buyer or seller after proposal process
async function bcAcceptProposeInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "AcceptInvoiceProposal";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled) {
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice Proposal: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

// Proposing Invoice by buyer or seller after proposal process
async function bcRejectProposeInvoice(cardName, invoice) {
	if(config.dataEncryptionEnabled) {
		invoice = JSON.parse(JSON.stringify(invoice));
		coreutils.encrypt(invoice, 'invoice');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "RejectInvoiceProposal";

	try {
		await businessNetworkConnection.connect(cardName);

		const bnDef = businessNetworkConnection.getBusinessNetwork();
		const factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);

		transaction.setPropertyValue('invoiceNumber', invoice.invoiceNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(invoice.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', invoice.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(invoice.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', invoice.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Invoice Proposal: " + invoice.invoiceNumber);

		console.log(transactionType + " Transaction Submitted successfully " + transaction);
		console.log('Json' + JSON.stringify(transaction));

		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
	} catch (error) {
		console.log(error);
	}
}

