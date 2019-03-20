var Order = require('../models/order');
var OrderInterface = require('../models/orderInterface');

var Invoice = require('../models/invoice');
var InvoiceInterface = require('../models/invoiceInterface');

var BulkUpload = require('../models/bulkUpload');
var BulkUploadUtils = require('../utils/bulkUpload');

var Log = require('../controllers/transactionCtrl');
var status = require('../utils/core');

var OrderCtrl = require('../controllers/orderCtrl');
var InvoiceCtrl = require('../controllers/invoiceCtrl');

var config = require('../config/sysProp');
var orderStatus = status.orderStatus;
var invoiceStatus = status.invoiceStatus;

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

const namespace = "io.aeries.art.order";


function getInterface(service){
    if(service == 'order'){
        return OrderInterface;
    }else if(service == 'invoice'){
        return InvoiceInterface;
    }
}

function getClass(service){
    if(service == 'order'){
        return Order;
    }else if(service == 'invoice'){
        return Invoice;
    }
}

function init(data){
	if(!(data instanceof Buffer)){
		throw new Error('not a instanceof Buffer');
	}
	// removing spaces and splitting into lines
	return data.toString().trim().split(/(?:\r\n|\r|\n)/g);
}

function convertToOrderInterface(email, data){
    var order = new OrderInterface();
    order.statusCode = orderStatus.Created.code;
    order.statusMessage = orderStatus.Created.text;

    order.buyer = email;
    order.banker = 'banker1@aeries.io';
    var items = [];
    // parsing logic can change
    order.items = data[1] || [];
    order.seller = data[0] || [];

    order.amount = 0;
    for(var i=0;i<order.items.length;i++){
        order.amount += order.items[i].price || 0;
    }
    return order;
}

function convertToInvoiceInterface(email, data, buyer){
    var invoice = new InvoiceInterface();
    invoice.statusCode = invoiceStatus.Created.code;
    invoice.statusMessage = invoiceStatus.Created.text;

    invoice.seller = email;
    invoice.banker = 'banker1@aeries.io';
    

    invoice.amount = parseInt(data[0]||0);
    invoice.orderNumber = data[1];

    invoice.buyer = buyer;
    

    invoice.invoiceDescription = data[2];
    return invoice;
}

function interfaceToOrderClassConvertor(interfaceOrders){
    var order = new Order();

    order.statusCode = interfaceOrders.statusCode;
    order.statusMessage = interfaceOrders.statusMessage;
    order.seller = interfaceOrders.seller;
    order.buyer = interfaceOrders.buyer;
    order.banker = interfaceOrders.banker;
    order.items = interfaceOrders.items;
    order.amount = interfaceOrders.amount;

    return order;
}

async function getInvoiceParsedData(email, lines){
    var myData = [];
    for(var j=0;j<lines.length;j++){
        var data = lines[j].trim().split(",") || [];
        let order = await Order.findOne({ orderNumber: data[1] });
        if(order){
            convertedData = convertToInvoiceInterface(email, data, order.buyer);
        }else{
            console.log("*****Order record not found ***");
        }
        myData.push(convertedData);
    }
    return myData;
}

function getOrderParsedData(email, lines){
    var recordData = [];
    var convertedData = '';
    var myData = [];
		for(var j=0;j<lines.length;j++){
			// validate data in each line and add to errors records 
			//console.log("Line "+j+" - "+lines[j]);
			// parse csv data
            /*
            var data = lines[j].trim().split(",") || [];
			// validate data
			//console.log("Data is "+data );
            convertedData = '';
            // Move the conversion logics to respective Ctrls.
            
            if(fileType == 'order'){
                convertedData = convertToOrderInterface(req.session.user.email, data);
            }else if(fileType == 'invoice'){
                let order = await Order.findOne({ orderNumber: data[1] });
                if(order){
                    convertedData = convertToInvoiceInterface(req.session.user.email, data, order.buyer);
                }else{
                    console.log("*****Order record not found ***");
                }
                myData.push(convertedData);
            }*/
            if(j == 0){
               if(!lines[j].startsWith("GRANDHDR")){
                    console.log("Please send valid file");
                    res.json({"error":"Please send valid file"});
               }
            }else if(j == lines.length-1){
                var data = lines[j].trim().split(",") || [];
                console.log("Processed "+data[1]+" records");
            }else{
                var data = lines[j].trim().split(",") || [];
                if(lines[j].startsWith("HDR")){
                    recordData = [];
                    recordData.push(data[1]);
                    recordData.push([]);
                }else if(lines[j].startsWith("TRL")){
                    convertedData = convertToOrderInterface(email, recordData);
                    myData.push(convertedData);
                    recordData = [];
                } else{
                    var item = {
                        id:parseInt(data[0]),
                        description:data[1],
                        units:parseInt(data[2]),
                        price:parseInt(data[3])
                    }
                    recordData[1].push(item);
                }
            }

	
        }
        
    return myData;

}

function interfaceToInvoiceClassConvertor(interfaceInvoices){
    var invoice = new Invoice();

    invoice.statusCode = interfaceInvoices.statusCode;
    invoice.statusMessage = interfaceInvoices.statusMessage;

    invoice.seller = interfaceInvoices.seller;
    invoice.buyer = interfaceInvoices.buyer;
    invoice.banker = interfaceInvoices.banker;
    invoice.amount = interfaceInvoices.amount;
    invoice.invoiceDescription = interfaceInvoices.invoiceDescription;
    invoice.orderNumber = interfaceInvoices.orderNumber;

    return invoice;
}

// POST /carts/bulk (Create PO/Invoice by buyer/Seller respectively)
exports.createBulkUploads = async function(req, res){	

	if(!req.files)
		return res.status(400).json('No files were uploaded.');
	

    var fileType = req.body.fileType.toLowerCase();
    
    // validation for users
    

	if(!BulkUploadUtils.isValidFileType(fileType)){
		return res.json({"success" : "fail", "message":"Please select valid fileType"});
    }
    
    if(fileType == 'order'){
        if(req.session.user.role !== 'buyer'){
            return res.json({"error":"Please contact Admin"});
        }
    }else if(fileType == 'invoice'){
        if(req.session.user.role !== 'seller'){
            return res.json({"error":"Please contact Admin"});
        }
    }

	let sampleFile = req.files.bulkUploadFile;
	var lines = init(sampleFile.data);
	var totalLength = lines.length;

	//console.log(sampleFile.name);
	//console.log(sampleFile.data);
	//console.log(sampleFile.data.toString());
	// validate file details
	var errors;
	// myData can be saved in chunks
	var myData = [];
	
	console.log("lines length"+lines.length);
	if(lines && lines.length){
        if(fileType == 'order'){
            myData = getOrderParsedData(req.session.user.email, lines);
        }else if(fileType == 'invoice'){
            myData = await getInvoiceParsedData(req.session.user.email, lines);
        }
    
    }
	// initial timestamp
	await getInterface(fileType).create(myData);
	// final timestamp

	// Once the records are processed .. delete the records between these timestamp of that user
	console.log("saved records into Interface : "+ fileType);
	

	// BulkUpload save
	var bulkUpload = new BulkUpload();
	bulkUpload.fileName = sampleFile.name;

	bulkUpload.fileStatus = "File Uploaded"; // File processing 1-5000 -- File processed 20000 records
	bulkUpload.fileType = fileType;
	bulkUpload.errorMessage = "";
	bulkUpload.createdUser = req.session.user.email;
	var updatedBulkUpload = await bulkUpload.save();
	// delete once the processing is done based on the initial and final timestamps
	console.log("Part 1 - Done");
	console.log("Making async call to process batch of 5000 interface records");

	//loadIntoBC(totalLength, );
	//res.json({"status":"Step 1: File uploaded"});

    var batchLength = config.batchLength;
    
	console.log("totalLength: "+totalLength);
	var i=0;
    while(i<totalLength)
    {
        console.log("i value for batch is "+i);
		var interfaceRecords = await getInterface(fileType).find({},{"__v": false}).skip(i).limit(batchLength);
        console.log("Interface records are "+interfaceRecords);
        console.log("Interface records count "+interfaceRecords.length);
        var processedInterfaceRecords=[];
        var records=[];
		for(var k=0;k<interfaceRecords.length;k++){
			//var order1 = new Order(interfaceOrders[k]);
			
            if(fileType == 'order'){
                
                records.push(interfaceToOrderClassConvertor(interfaceRecords[k]));
            }else if(fileType == 'invoice'){
                records.push(interfaceToInvoiceClassConvertor(interfaceRecords[k]));
            }
            processedInterfaceRecords.push(interfaceRecords[k]._id);
			
		}

        var updatedRecords = await getClass(fileType).create(records);
        
        console.log("*******************************************");
        //console.log(updatedRecords);
        console.log("*****************************************");
        // Asynchronously making calls to blockchain and update the unique ids in respective Mongodb collections
        if(updatedRecords && updatedRecords.length > 0){
            if(fileType == 'order'){
                bcBulkCreateOrders(req.session.user.email, updatedRecords, req.session.user.email, '', 'banker1@aeries.io',
                processedInterfaceRecords, 1500, updatedRecords.length, updatedBulkUpload._id); // await
                // delete processed records from Interface table within the timestamps
                // loop updatedRecords with MongoDBID and update orderNumber
                
            }else if(fileType == 'invoice'){
                bcBulkCreateInvoices(req.session.user.email, updatedRecords, '', req.session.user.email, 'banker1@aeries.io',
                    processedInterfaceRecords, 1500, updatedRecords.length, updatedBulkUpload._id); // await
            }
        }

		console.log("Updated Records "+updatedRecords);
		i+=batchLength;
	}
	
	console.log("Process MongoDB interface records and delete once the process in done");
	res.json({"success":true});
};

// carts/bulk
exports.getBulkUploads = async function(req, res){
    var email = req.session.user.email;
    console.log(email);
    var bulkUploads = await BulkUpload.find({createdUser: email});
    res.json({"success":"true", "data": bulkUploads});
    
}

/*
 * Blockchain functions
 */

async function bcBulkCreateOrders(cardName, orders, buyerData, sellerData, bankerData, processedInterfaceRecords, retry, totalCount,
        bulkUploadId) {
	console.log("bcBulkCreateOrder"+orders.length);

    try {
        for(var j=0; j < orders.length; j++)
        {
			var updatedOrder = orders[j];
            
			let result = await OrderCtrl.bcUpsertOrder(cardName, updatedOrder);
            // Fetch OrderNumber based on transactionHash and update the database
            let transactionId = JSON.parse(result).transactionId;
            console.log("hash is "+transactionId);
            let id = updatedOrder._id;
            let orderNumberData = await OrderCtrl.bcGetOrderNumberById(cardName, id);
            console.log("Order Number data"+JSON.stringify(orderNumberData));
            // check for length validation
            console.log(orderNumberData[0].orderNumber);
            // updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
            updatedOrder.orderNumber = orderNumberData[0].orderNumber;
            await updatedOrder.save();
            await Log.transactionlog(updatedOrder.orderNumber, 'Order', 'UpsertOrder', 'Order Created', cardName, 'buyer',
            cardName, updatedOrder.seller,	updatedOrder.banker, transactionId);
		}

        /*
		let transaction = factory.newTransaction(namespace, transactionType);
		var bcOrders = [];
        for(var j=0; j < orders.length; j++)
        {
			var order = orders[j];
			
			var bcorder = factory.newConcept(namespace, "OrderSearch");
			bcorder.items = [];
			
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

			if(items.length > 0){
				bcorder.items = items;
			}
			//bcorder.orderNumber = "1";
			bcorder.amount =order.amount;
			bcorder.id = order._id+"";

			let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', order.buyer);

	    	let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', order.seller);

			let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', order.banker);

			bcorder.buyer = buyer;
			bcorder.seller = seller;
			bcorder.banker = banker;
			bcOrders.push(bcorder);
		}

		transaction.setPropertyValue('orders', bcOrders);
		
		let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', buyerData);
		transaction.setPropertyValue('buyer', buyer);

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', bankerData);
        transaction.setPropertyValue('banker', banker);
        */

		/*await businessNetworkConnection.submitTransaction(transaction);
			console.log("Saved the batch orders");
		    console.log(transactionType+" Transaction Submitted successfully "+transaction);
            console.log('Json'+JSON.stringify(transaction));
        */
        /*
        for(var m=0;m<orders.length;m++)
        {
            console.log("Loop "+m);
            var order = orders[m];
            let id = order._id;
            console.log("Id is "+id);
            let orderNumberData = await businessNetworkConnection.query('selectOrdersById', {id:id});
            console.log("Order Number data"+JSON.stringify(orderNumberData));
            if(orderNumberData && orderNumberData.length>0){
                
                // check for length validation
                console.log(orderNumberData[0].orderNumber);
                // updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
                order.orderNumber = orderNumberData[0].orderNumber;
                await order.save();
                console.log("Order is saved");
           
            
                console.log("Removed from interface table");
            }
        }*/

        console.log("Updated the order numbers in mongodb");
        console.log("Delete the records from the Interface based on Timestamp");
        console.log(processedInterfaceRecords);

        await OrderInterface.deleteMany({ _id: { $in: processedInterfaceRecords}});

        var bulkUpload = await BulkUpload.findOne({_id: bulkUploadId});
        bulkUpload.processed+= processedInterfaceRecords.length;
        bulkUpload.fileStatus = "Processed "+bulkUpload.processed+" of "+totalCount+" Records";
        var updatedBulkUpload = await bulkUpload.save();

        if(updatedBulkUpload.processed = totalCount){
            updatedBulkUpload.fileStatus = "Records processed";
            await updatedBulkUpload.save();
        }

        //await businessNetworkConnection.disconnect();

        //return JSON.stringify(transactionId);
        return 0;
    } catch(error) {
        console.log("Error is "+error);
        if(error && error.message.includes("MVCC_READ_CONFLICT")){
        //if(error.indexOf("MVCC_READ_CONFLICT")>-1){
            console.log("Its MVCC_READ_CONFLICT error. Retrying the call");
            // Retry the call
            // track error records
            /*
            setTimeout(() => {
                bcBulkCreateOrders(cardName, orders, buyerData, sellerData, bankerData, processedInterfaceRecords, 2*retry);  
            }, retry + Math.floor(Math.random() * Math.floor(1000)));
            */
        }else if(error && error.message.includes("No valid responses from any peers")){
            console.log("Entered into no valid responses from any peers");
            /*setTimeout(() => {
                bcBulkCreateOrders(cardName, orders, buyerData, sellerData, bankerData, processedInterfaceRecords, 2*retry);  
            }, retry + Math.floor(Math.random() * Math.floor(1000)));
            */
        }
    }
    

}

// start and endtimestaps of batch records
async function bcBulkCreateInvoices(cardName, invoices, buyerData, sellerData, bankerData, processedInterfaceRecords, retry, totalCount,
    bulkUploadId) {
	console.log("bcBulkCreateInvoices"+invoices.length);
	//let businessNetworkConnection = new BusinessNetworkConnection();
    //let transactionType = "CreateInvoices";
    try{
        for(var j=0; j < invoices.length; j++)
        {
            var updatedInvoice = invoices[j];

            let result = await InvoiceCtrl.bcUpsertInvoice(cardName, updatedInvoice);
            let transactionId = JSON.parse(result).transactionId;
            console.log("Hash is "+transactionId);
            
            let id = updatedInvoice._id;
            console.log("Id is "+id);
            let invoiceNumberData = await InvoiceCtrl.bcGetInvoiceNumberById(cardName, id);
            console.log("Invoice Number data"+JSON.stringify(invoiceNumberData));
            // check for length validation
            console.log(invoiceNumberData[0].invoiceNumber);
            // updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
            updatedInvoice.invoiceNumber = invoiceNumberData[0].invoiceNumber;
            await updatedInvoice.save();
            await Log.transactionlog(updatedInvoice.invoiceNumber, 'Invoice', 'UpsertInvoice', 'Invoice Created', cardName, 
            'seller', updatedInvoice.buyer, updatedInvoice.seller, updatedInvoice.banker, transactionId);
            
        }
    
    

/*
    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

		let transaction = factory.newTransaction(namespace, transactionType);
		var bcInvoices = [];
        for(var j=0; j < invoices.length; j++)
        {
			var invoice = invoices[j];
			
			var bcinvoice = factory.newConcept(namespace, "InvoiceSearch");
			
            bcinvoice.amount =invoice.amount;
            bcinvoice.invoiceDescription =invoice.invoiceDescription || '';
            bcinvoice.orderNumber = invoice.orderNumber;
			bcinvoice.id = invoice._id+"";

			let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', invoice.buyer);

	    	let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', invoice.seller);

			let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', invoice.banker);

			bcinvoice.buyer = buyer;
			bcinvoice.seller = seller;
			bcinvoice.banker = banker;
			bcInvoices.push(bcinvoice);
		}

		transaction.setPropertyValue('invoices', bcInvoices);


        let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', sellerData);
        transaction.setPropertyValue('seller', seller);
	    
		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', bankerData);
		transaction.setPropertyValue('banker', banker);

		await businessNetworkConnection.submitTransaction(transaction);
			console.log("Saved the batch invoices");
		//console.log(transactionType+" Transaction Submitted successfully "+transaction);
        //console.log('Json'+JSON.stringify(transaction));
        
        
        for(var m=0;m<invoices.length;m++){
            console.log("Loop "+m);
            var invoice = invoices[m];
            let id = invoice._id;
            console.log("Id is "+id);
            let invoiceNumberData = await businessNetworkConnection.query('selectInvoicesById', {id:id});
            console.log("Invoice Number data"+JSON.stringify(invoiceNumberData));
            if(invoiceNumberData && invoiceNumberData.length>0){
                
                // check for length validation
                console.log(invoiceNumberData[0].invoiceNumber);
                // updatedOrder.transactionHash = transactionHash; --> Should be stored as part of log table for that asset property
                invoice.invoiceNumber = invoiceNumberData[0].invoiceNumber;
                await invoice.save();
                console.log("Invoice is saved");
            }else{
                console.log("Problem in fetching the invoice by id:"+id);
            }
            
        }
        */
        console.log(processedInterfaceRecords);

        console.log("Updated the order numbers in mongodb");
        console.log("Delete the records from the Interface based on Timestamp");
        await InvoiceInterface.deleteMany({ _id: { $in: processedInterfaceRecords}});
        // get processed count from Mongodb and add with current set

        var bulkUpload = await BulkUpload.findOne({_id: bulkUploadId});
        bulkUpload.processed+= processedInterfaceRecords.length;
        bulkUpload.fileStatus = "Processed "+bulkUpload.processed+" of "+totalCount+" Records";
        var updatedBulkUpload = await bulkUpload.save();

        if(updatedBulkUpload.processed = totalCount){
            updatedBulkUpload.fileStatus = "Records processed";
            await updatedBulkUpload.save();
        }

        //await businessNetworkConnection.disconnect();
        //return JSON.stringify(transaction);
        return 0;
    } catch(error) {
        console.log("Error is "+error);
        if(error && error.includes("MVCC_READ_CONFLICT")){
            console.log("Its MVCC_READ_CONFLICT error. Retrying the call");
            // Retry the call
            /*setTimeout(() => {
                bcBulkCreateInvoices(cardName, invoices, buyerData, sellerData, bankerData, processedInterfaceRecords, 2*retry);
            }, retry + Math.floor(Math.random() * Math.floor(1000)));
            */
        }else{
            console.log("Not MVCC Read Conflict error");
        }
    }
    

}