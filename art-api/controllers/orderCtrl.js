var Order = require('../models/order');
var coreutils = require('../utils/core');
var config = require('../config/sysProp');
var Log = require('../controllers/transactionCtrl');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const namespace = "io.aeries.art.order";

var orderStatus = require('../utils/core').orderStatus;

// POST /orders/carts (Create PO by buyer)
exports.createOrder = async function(req, res){
	// request validations

	//if(!req.files)
	//	return res.status(400).json('No files were uploaded.');
	
	//--let sampleFile = req.files.artdoc;
	let seller = req.body.seller || '';
	//seller = 'resource:io.aeries.art.participant.Seller#'+seller; // selects from buyer sellers list
	//--console.log(sampleFile.name);



	// Use the mv() method to place the file somewhere on your server
  
	/*sampleFile.mv('uploads/'+sampleFile.name, function(err) {
    if (err)
		  return res.status(500).send(err);
	 
		res.json({message: 'File uploaded!'});
	  });*/
	

	// Replace this upload file with IPFS
    //--try{
	//--	sampleFile.mv('uploads/'+ sampleFile.name);
	//--	console.log('Moved into Uploads');
	//--}catch(err){
	//--	console.log('Problem in moving file into uploads');
	//--}
	
	
	var order = new Order();
	
	//status: { type : String },
	//orderFilePath
	
	
	//order.orderNumber = "ABC-"+Date.now();
	// update orderNumber after writing to blockchain
	order.statusCode = orderStatus.Created.code;
	order.statusMessage = orderStatus.Created.text;
	order.seller = seller;
	order.buyer = req.session.user.email;
	order.banker = 'banker1@aeries.io';
	if(config.makerCheckerEnabled){
		if(req.session.user.buyerchecker){
			order.buyerchecker = req.session.user.buyerchecker;
		}
		if(req.session.user.sellerchecker){
			order.sellerchecker = req.session.user.sellerchecker;
		}
	}
	
	
	order.items = req.body.items || [];
	order.amount = 0;
	for(var i=0;i<order.items.length;i++){
		order.amount += order.items[i].price || 0;
	}

	console.log("Amount is "+order.amount);

	//--order.orderFilePath='uploads/'+sampleFile.name;
	
	// convert into hash and make a blockchain call which registers the hash
	try{
		let updatedOrder = await order.save();
		console.log('Updated Order is '+updatedOrder);
		if(updatedOrder){
			let result = await bcUpsertOrder(req.session.user.email, updatedOrder);
			// Fetch OrderNumber based on transactionHash and update the database
			let transactionId = JSON.parse(result).transactionId;
			console.log("hash is "+transactionId);
			let id = updatedOrder._id;
			let orderNumberData = await bcGetOrderNumberById(req.session.user.email, id);
			console.log("Order Number data"+JSON.stringify(orderNumberData));
			// check for length validation
			console.log(orderNumberData[0].orderNumber);
			// updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
			updatedOrder.orderNumber = orderNumberData[0].orderNumber;
			await updatedOrder.save();
			await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'UpsertOrder', 'Order Created', req.session.user.email, req.session.user.role,
			req.session.user.email, updatedOrder.seller,	updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker,transactionId);
			return res.json({status: 'success', message: 'Order Added', 'transactionHash': transactionId});
		}else{
			console.log("Order not created");
			return res.json({ status: 'fail', message: 'Order not created'});
		}
	}catch(err){
		return res.send(err);
	}
};
exports.getOrderById = async function(req,res){
	console.log(req.body)
	let orderNumber = req.params.id;
	console.log(orderNumber)
	try{
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			res.json({message: "Order Details",orderDetail: order })
		}else{
			res.json({message: "Order Details not Found"})			
		}		
	}catch(err){
		res.send(err);
	}
}
exports.searchForOrders = async function(req,res){
	console.log(req.body);
	var query = {};
	if(req.body.orderId){
		query.orderNumber = req.body.orderId;
	}if(req.body.sellerId){
		query.seller = req.body.sellerId;
	}
	console.log(query);
	let order = await Order.find(query);
	if(order){
		console.log(order);
		res.json(order);
	}else{
		res.json({status : -1})
	}
}

// PUT /orders/cart/:id (Update PO by buyer)
exports.updateOrder = async function(req, res){
	let seller = req.body.seller || '';
	//seller = 'resource:io.aeries.art.participant.Seller#'+seller;
	let orderNumber = req.params.id;
	if(!orderNumber){
		console.log("Ordernumber is "+orderNumber);
		res.json({"Error: ":"Please provide ordernumber."});
	}

	// validation for inputs

	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.Updated.code;
			order.statusMessage = orderStatus.Updated.text;
			order.seller = seller;
			order.buyer = req.session.user.email;
			order.banker = 'banker1@aeries.io';
			order.items = req.body.items || [];
			order.amount = 0;
			for(var i=0;i<order.items.length;i++){
				order.amount += order.items[i].price || 0;
			}
			order.orderNumber = orderNumber || '';

			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcUpsertOrder(req.session.user.email, updatedOrder);
				// if result returns transactionHash update the database
                let transactionId = JSON.parse(result).transactionId;
				console.log("hash is "+transactionId)
				
				await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'UpsertOrder', 'Order Updated', req.session.user.email, req.session.user.role,
				req.session.user.email, updatedOrder.seller, updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				res.json({message: 'Order Updated', 'transactionHash': transactionId});
			}else{
				console.log("Order not found");
			}
		}
			
	}catch(err){
		res.send(err);
	}
};

// POST /orders (Submit PO by buyer)
// Will also submit the updated changes
exports.submitOrder = async function(req, res){
	let seller = req.body.seller || '';
	let orderNumber = req.body.id;
	//seller = 'resource:io.aeries.art.participant.Seller#'+seller;
	// check if user present in buyer collection list

	// validation for inputs
	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.Submit.code;
			order.statusMessage = orderStatus.Submit.text;
			order.seller = seller;
			order.buyer = req.session.user.email;
			order.banker = 'banker1@aeries.io';
			order.items = req.body.items || [];
			order.amount = 0;
			for(var i=0;i<order.items.length;i++){
				order.amount += order.items[i].price || 0;
			}
			order.orderNumber = orderNumber || '';

			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcSubmitOrder(req.session.user.email, updatedOrder);
				let transactionId = JSON.parse(result).transactionId;
				// if result returns orderNumber/transactionHash update the database
				await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'SubmitOrder', 'Order Submitted', req.session.user.email, req.session.user.role,
				req.session.user.email, updatedOrder.seller, updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				res.json({message: 'Order Submitted', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};

// POST /orders/:id/cancel (Cancelled PO by buyer)
exports.cancelOrder = async function(req, res){
	let orderNumber = req.params.id;
	// validation for inputs
	console.log("Cancel Order "+orderNumber);
	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.Cancelled.code;
			order.statusMessage = orderStatus.Cancelled.text;
			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcCancelOrder(req.session.user.email, updatedOrder);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'CancelOrder', 'Cancel Order', req.session.user.email, req.session.user.role,
				updatedOrder.buyer, req.session.user.email,updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				res.json({message: 'Cancel Order', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};

// POST /orders/:id/approve (Approve PO by seller)
exports.rejectApproveOrder = async function(req, res){
	let orderNumber = req.params.id;
	// validation for inputs
	console.log("Approve Order "+orderNumber);
	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.RejectApproval.code;
			order.statusMessage = orderStatus.RejectApproval.text;
			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcRejectPOApproval(req.session.user.email, updatedOrder);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'RejectPOApproval', 'Order Approval Rejected', req.session.user.email, req.session.user.role,
				updatedOrder.buyer, req.session.user.email, updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				res.json({message: 'Order Approval Rejected', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};

// POST /orders/:id/approve (Approve PO by seller)
exports.approveOrder = async function(req, res){
	let orderNumber = req.params.id;
	// validation for inputs
	console.log("Approve Order "+orderNumber);
	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.Approve.code;
			order.statusMessage = orderStatus.Approve.text;
			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcApproveOrder(req.session.user.email, updatedOrder);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactioncheckerlog(updatedOrder.orderNumber, 'Order', 'POApproval', 'Order Approved', req.session.user.email, req.session.user.role,
				updatedOrder.buyer, req.session.user.email,updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);
				res.json({message: 'Order Approved', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};

/*
// POST /orders/:id/approve/checker (Approve PO by checker)
exports.approveOrderByChecker = async function(req, res){
	// validate checker role
	let orderNumber = req.params.id;
	// validation for inputs
	console.log("Approve Order by checker "+orderNumber);
	try{
		// Make an update call
		let order = await Order.findOne({orderNumber: orderNumber});
		if(order){
			order.statusCode = orderStatus.ApproveChecker.code;
			order.statusMessage = orderStatus.ApproveChecker.text;
			let updatedOrder = await order.save();
			if(updatedOrder){
				let result = await bcApproveOrderByChecker(req.session.user.email, updatedOrder);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
				var transactionId = JSON.parse(result).transactionId;
				await Log.transactionlog(updatedOrder.orderNumber, 'Order', 'POApprovalChecker', 'Order Approved By Checker', req.session.user.email, req.session.user.role,
					updatedOrder.buyer, req.session.user.email, updatedOrder.banker, req.session.user.buyerchecker, req.session.user.sellerchecker, transactionId);

				res.json({message: 'Order Approved By Checker', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};
*/

exports.deleteOrder = function(req, res) {
	return res.json({'message':'Deleted order'});
};

exports.getAllOrders = async function(req, res) {
	var role = req.session.user.role;
	var orders = await getOrders(req.session.user.email);
	if(config.dataEncryptionEnabled && role !== 'auditor') {
		coreutils.decrypt(orders,'order');
	}
	return res.json({'message':'Order List', 'orders': orders });
};

/*
	Blockchain Functions
*/

var bcUpsertOrder = async function (cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "UpsertOrder";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
		var items = []; // loop all input array items and build order
		var orderItems = order.items;
		for(i=0; i<orderItems.length;i++){
			let item = factory.newConcept(namespace, "Item");
			item.id = orderItems[i].id || 0;
			item.description = orderItems[i].description || '';
			item.units = orderItems[i].units || 0;
			item.price = orderItems[i].price || 0; // calculates the total amount in chaincode
			items.push(item);
		}

		let isUpdate = false;
		if(order.orderNumber){
			isUpdate = true;
			transaction.setPropertyValue('orderNumber', order.orderNumber);
		}

		if(items.length > 0){
			
			transaction.setPropertyValue('items',items);
		}

		transaction.setPropertyValue('amount', order.amount);
		
		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);

	    let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		transaction.setPropertyValue('id', order._id+'');

		await businessNetworkConnection.submitTransaction(transaction);
		if(isUpdate){
			console.log("Updated the Order : "+order.orderNumber);
		}else{
			console.log("Saved the order"+order);
		}
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

exports.bcUpsertOrder = bcUpsertOrder;

var bcGetOrderNumberById = async function(cardName, id) {
	console.log("Entered into orderbyid");
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' order based on MongoDB ID');
		return await businessNetworkConnection.query('selectOrdersById', {id:id});
	}catch(err){
		console.log(err);
	}
}

exports.bcGetOrderNumberById = bcGetOrderNumberById;

async function bcSubmitOrder(cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "SubmitOrder";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
		var items = []; // loop all input array items and build order
		var orderItems = order.items;
		for(i=0; i<orderItems.length;i++){
			let item = factory.newConcept(namespace, "Item");
			item.id = orderItems[i].id || '';
			item.description = orderItems[i].description || '';
			item.units = orderItems[i].units || 0;
			item.price = orderItems[i].price || 0; // calculates the total amount in chaincode
			items.push(item);
		}

		transaction.setPropertyValue('amount', order.amount);
		transaction.setPropertyValue('id', order._id+'');
		transaction.setPropertyValue('orderNumber', order.orderNumber);
		transaction.setPropertyValue('items',items);
		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);
		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);
		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Submitted the Order : "+order.orderNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcCancelOrder(cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "CancelOrder";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
	
		transaction.setPropertyValue('orderNumber', order.orderNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Cancelled Order : "+ order.orderNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcRejectPOApproval(cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "RejectPOApproval";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
	
		transaction.setPropertyValue('orderNumber', order.orderNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Reject Order Approval : "+ order.orderNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcApproveOrder(cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "POApproval";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
	
		transaction.setPropertyValue('orderNumber', order.orderNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Approved Order : "+ order.orderNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

/*
async function bcApproveOrderByChecker(cardName, order) {
	if(config.dataEncryptionEnabled) {
		order = JSON.parse(JSON.stringify(order));
		coreutils.encrypt(order, 'order');
	}
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "POApprovalChecker";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
	
		transaction.setPropertyValue('orderNumber', order.orderNumber);

		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);
		transaction.setPropertyValue('buyer', buyer);

		let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);
		transaction.setPropertyValue('seller', seller);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);
		transaction.setPropertyValue('banker', banker);

		if(config.makerCheckerEnabled){
			transaction.setPropertyValue('checkerDependency', true);
			
			if(order.buyerchecker){
				let buyerchecker = factory.newRelationship('io.aeries.art.participant', 'BuyerChecker', order.buyerchecker);
				transaction.setPropertyValue('buyerChecker', buyerchecker);
			}
			if(order.sellerchecker){
				let sellerchecker = factory.newRelationship('io.aeries.art.participant', 'SellerChecker', order.sellerchecker);
				transaction.setPropertyValue('sellerChecker', sellerchecker);
			}
		}

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Checker Approved the Order : "+ order.orderNumber);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}
*/

async function getOrders(cardName) {
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' orders');
		return await businessNetworkConnection.query('selectOrders');
	}catch(err){
		console.log(err);
	}
}
