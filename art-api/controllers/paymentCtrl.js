var Payment = require('../models/payment');
var Invoice = require('../models/invoice');
var User = require('../models/user');
var base64= require("base64-stream");

var Log = require('../controllers/transactionCtrl');
var config = require('../config/sysProp');
var coreutils = require("../utils/core");

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

const namespace = "io.aeries.art.payment";

var paymentStatus = {
    Created: {code: 201, text: 'Payment Created'},
    Updated: {code: 202, text: 'Payment Updated'},
    Cancelled: {code: 203, text: 'Payment Cancelled'},
    Refunded: {code: 204, text: 'Payment Refunded'},
    SellerApproved: {code: 205, text: "Seller's Payment Approved"},
    BankerApproved: {code: 206, text: "Banker's Payment Approved"}

};

// POST /payments (Create Payment by banker/buyer)
exports.createPayment = async function(req, res){
    // payment can be done only after proposal

    // request validations
    
    let role = req.session.user.role;
    var payment = new Payment();
    // update orderNumber after writing to blockchain
    payment.statusCode = paymentStatus.Created.code;
    payment.statusMessage = paymentStatus.Created.text;
    var paymentData = JSON.parse(req.body.paymentData);    
    payment.amount = paymentData.amount || 0;
    payment.utrNumber = paymentData.utrNumber;
    let invoiceNumber = paymentData.invoiceNumber;
    payment.invoiceNumber = invoiceNumber || '';
    var intent;
    let buyer,seller,banker;
    
    let invoice = await Invoice.findOne({invoiceNumber: invoiceNumber});
    console.log("Finding Invoice");
    if(invoice){
        console.log("Found invoice");
        if(invoice.statusCode !== 109){
            return res.json({"Error":"StatusCode is not proposed yet. Waiting for proposal"});
        }
    }else{
        return res.json({"Error":"Please contact admin"});
    }
    if(role == 'banker'){
        intent = 'banker-seller';
        console.log("its banker role");
        payment.banker = req.session.user.email;
        banker = payment.banker;
         

        // Get seller details from invoiceNumber
        payment.orderNumber = invoice.orderNumber;
        var base64PaymentReceipt = (req.files.files.data||"").toString('base64');
        payment.paymentDataBanker = base64PaymentReceipt
        console.log("Invoice is present"+invoice);
        payment.seller = invoice.seller || '';
        seller = invoice.seller || '';

    }else if(role == 'buyer'){
        intent = 'buyer-banker';
        payment.buyer = req.session.user.email;
        buyer = req.session.user.email;
        // User doesnt send banker details
        payment.banker = 'banker1@aeries.io';
        banker = 'banker1@aeries.io';
        var base64PaymentReceipt = (req.files.files.data||"").toString('base64');
        payment.paymentDataBuyer = base64PaymentReceipt
        // update orderNumber from invoice
        payment.orderNumber = invoice.orderNumber;
        console.log("Invoice is present"+invoice);

    }else{
        return res.json({'error':'Please contact Admin. Not valid role'});
    }

    try{
        let updatedPayment = await payment.save();
        console.log('Updated Payment is '+updatedPayment);
        if(updatedPayment){
            let result = await bcUpsertPayment(req.session.user.email, updatedPayment, role);
            // Fetch PaymentNumber based on transactionHash and update the database
            let transactionId = JSON.parse(result).transactionId;
            console.log("hash is "+transactionId);
            let id = updatedPayment._id;
            let paymentNumberData = await bcGetPaymentNumberById(req.session.user.email, id);
            console.log("Payment Number data"+JSON.stringify(paymentNumberData));
            // check for length validation
            console.log(paymentNumberData[0].paymentNumber);
            // updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
            updatedPayment.paymentNumber = paymentNumberData[0].paymentNumber;
            await updatedPayment.save();
            
            await Log.transactionlog(updatedPayment.paymentNumber, 'Payment', 'UpsertPayment', 'Payment Created : '+intent, req.session.user.email,
            req.session.user.role, buyer, seller, banker, transactionId);
            return res.json({status: 'success', message: 'Payment Details Added', 'transactionHash': transactionId});
        }
    }catch(err){
        console.log(err);
        return res.send({status: 'false', message: 'Please contact admin'});
    }
}

// POST /payments/:id/approve (Approve payment by seller/banker)
exports.approvePayment = async function(req, res){
	// validation for inputs
    let paymentNumber = req.params.id;
    const role = req.session.user.role;
    var intent;
    
    // validations for allowing only seller and banker
	try{
		// Make an update call
        var payment = await Payment.findOne({paymentNumber: paymentNumber});
        let invoice = await Invoice.findOne({invoiceNumber: payment.invoiceNumber});
		console.log("Finding Payment");
		if(payment){
            var data = {};
            data.paymentStatus = false;
            let buyerData = await User.findOne({ email : invoice.buyer});
            let sellerData = await User.findOne({ email : invoice.seller});

            if(role == 'seller'){
                intent = 'banker-seller';
                payment.statusCode = paymentStatus.SellerApproved.code;
                payment.statusMessage = paymentStatus.SellerApproved.text;
                
                buyerData.maxlimit -= payment.amount;
                sellerData.maxlimit -= payment.amount;
                invoice.bankerAmountPaidToSeller =+ payment.amount;
                data.paymentAmount = invoice.bankerAmountPaidToSeller;
                data.buyerAmount = buyerData.maxlimit;
                data.sellerAmount = sellerData.maxlimit;


                if(invoice.bankerAmountPaidToSeller >= invoice.amount){
                    invoice.sellerPaymentStatus = true;
                    data.paymentStatus = invoice.sellerPaymentStatus;
                }
                let buyerLimitUpdated = await buyerData.save();
                let sellerLimitUpdated = await sellerData.save();
                console.log("Credit Limit Updated in Buyer to: "+buyerLimitUpdated.maxlimit); 
                console.log("Credit Limit Updated in Seller to: "+sellerLimitUpdated.maxlimit);

            } else if(role == 'banker'){
                intent = 'buyer-banker';
                payment.statusCode = paymentStatus.BankerApproved.code;
                payment.statusMessage = paymentStatus.BankerApproved.text;

                buyerData.maxlimit += payment.amount;
                sellerData.maxlimit += payment.amount;
                invoice.buyerAmountPaidToBanker =+ payment.amount;
                data.paymentAmount = invoice.buyerAmountPaidToBanker;
                data.buyerAmount = buyerData.maxlimit;
                data.sellerAmount = sellerData.maxlimit;
                
                if(invoice.buyerAmountPaidToBanker >= invoice.amount){
                    invoice.bankerPaymentStatus = true;
                    data.paymentStatus = invoice.bankerPaymentStatus;
                }
                let buyerLimitUpdated = await buyerData.save();
                let sellerLimitUpdated = await sellerData.save();
                console.log("Credit Limit Updated in Buyer to: "+buyerLimitUpdated.maxlimit); 
                console.log("Credit Limit Updated in Seller to: "+sellerLimitUpdated.maxlimit);
            }
            console.log("Data is "+JSON.stringify(data));

			let updatedPayment = await payment.save();
			console.log(updatedPayment);
			if(updatedPayment){
                let result = await bcApprovePayment(req.session.user.email, updatedPayment, role, data);
                
                let transactionId = JSON.parse(result).transactionId;
                console.log("TransactionHash is "+transactionId);
                // if result returns invoiceNumber/transactionHash update the database
                await Log.transactionlog(updatedPayment.paymentNumber, 'Payment', 'PaymentApproval', 'Payment Approved : '+intent, req.session.user.email,
                req.session.user.role, updatedPayment.buyer, updatedPayment.seller, updatedPayment.banker, transactionId);
				return res.json({message: 'Payment Approved', 'transactionHash': transactionId});
			}
		}else{
            console.log("Payment record not found. Please contact admin");
            return res.json({"error":"Payment record not found"});
		}
		
	}catch(err){
		return res.send(err);
	}
};
exports.viewPayment = function(request, response) {
    Payment.findOne({
            paymentNumber: request.body.paymentNumber||" "
        })
        .exec(function(err, data) {
            if (err) {
                console.log(err);
                console.log("viewInvoice --error in finding the Invoice");
                response.send(utils.failure);
            } else {
                
                var buf = Buffer.from(data.paymentDataBanker, 'base64');
                response.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': 'attachment;filename=' + data.paymentNumber + ".pdf",
                    'Content-Length': buf.length
                });
                response.end(buf);
            }
        });
    }

exports.searchForPayments = async function(req,res){
    console.log(req.body);
    var query = {};
    if(req.body.paymentId){
        query.paymentNumber = req.body.paymentId;
    }if(req.body.sellerId){
        query.seller = req.body.sellerId;
    }
    console.log(query);
    let payment = await Payment.find(query);
    if(payment){
        console.log(payment);
        res.json(payment);
    }else{
        res.json({status : -1})
    }
}

exports.viewPaymentBuyer = function(request, response) {
    Payment.findOne({
            paymentNumber: request.body.paymentNumber||" "
        })
        .exec(function(err, data) {
            if (err) {
                console.log(err);
                console.log("viewInvoice --error in finding the Invoice");
                response.send(utils.failure);
            } else {
                
                var buf = Buffer.from(data.paymentDataBuyer, 'base64');
                response.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': 'attachment;filename=' + data.paymentNumber + ".pdf",
                    'Content-Length': buf.length
                });
                response.end(buf);
            }
        });
    }
// pagination
exports.getAllPayments = async function(req, res){
	// get cart orders from database
    var role = req.session.user.role;
    var payments = await getPayments(req.session.user.email);
    if(config.dataEncryptionEnabled && role !== 'auditor') {
		coreutils.decrypt(payments, 'payment');
	}
	return res.json({'message':'Payment List', 'data': payments});
};

/*
	Blockchain Functions
*/

async function getPayments(cardName){
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' Payments');
		return await businessNetworkConnection.query('selectPayments');
	}catch(err){
        console.log(error);
	}
}


async function bcUpsertPayment(cardName, payment, role) {
    if(config.dataEncryptionEnabled) {
		payment = JSON.parse(JSON.stringify(payment));
		coreutils.encrypt(payment, 'payment');
	}
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "UpsertPayment";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();
        let transaction = factory.newTransaction(namespace, transactionType);
		
        transaction.setPropertyValue('id',payment._id+'');
        transaction.setPropertyValue('utrNumber',payment.utrNumber);
        transaction.setPropertyValue('invoiceNumber',payment.invoiceNumber);
        transaction.setPropertyValue('orderNumber',payment.orderNumber);
        transaction.setPropertyValue('amount',payment.amount+'');

        // validate if the users exist in db before inserting into blockchain
        if(role == 'banker'){
            transaction.setPropertyValue('intent', 'banker-seller');
            let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', payment.banker);
            transaction.setPropertyValue('banker', banker);
            let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', payment.seller);
            transaction.setPropertyValue('seller', seller);

        }else if(role == 'buyer'){
            transaction.setPropertyValue('intent', 'buyer-banker');
            let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', payment.banker);
            transaction.setPropertyValue('banker', banker);
            let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', payment.buyer);
            transaction.setPropertyValue('buyer', buyer);

        }

		await businessNetworkConnection.submitTransaction(transaction);

        console.log("Saved the Payment "+payment);
        
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcApprovePayment(cardName, payment, role, data) {
    if(config.dataEncryptionEnabled) {
		payment = JSON.parse(JSON.stringify(payment));
		coreutils.encrypt(payment, 'payment');
    }
    console.log(payment);
    console.log(data);
    
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "PaymentApproval";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
    
        transaction.setPropertyValue('paymentNumber', payment.paymentNumber);

        transaction.setPropertyValue('paymentStatus', data.paymentStatus);
        if(data.buyerAmount){
            transaction.setPropertyValue('buyerAmount', data.buyerAmount+'');
        }
        if(data.sellerAmount){
            transaction.setPropertyValue('sellerAmount', data.sellerAmount+'');
        }

        if(data.paymentAmount){
            transaction.setPropertyValue('paymentAmount', data.paymentAmount+'');
        }

        if(role == 'seller'){
            let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', payment.seller);
            transaction.setPropertyValue('seller', seller);
        }else if(role == 'banker'){
            let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', payment.buyer);
            transaction.setPropertyValue('buyer', buyer);
        }
        let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', payment.banker);
        transaction.setPropertyValue('banker', banker);

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Payment Approval: "+ payment.paymentNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcGetPaymentNumberById(cardName, id){
	console.log("Entered into paymentbyid");
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' payment based on MongoDB ID');
		return await businessNetworkConnection.query('selectPaymentsById', {id:id});
	}catch(err){
		console.log(err);
	}
}
