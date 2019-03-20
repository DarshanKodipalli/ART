'use strict';

var orderStatus = {
    Created: {code: 1, text: 'Order Created'},
    Updated: {code: 2, text: 'Order Updated'},
    Bought: {code: 3, text: 'Order Purchased'},
    Correction: {code: 4, text: 'Order Correction Required'},
    Cancelled: {code: 5, text: 'Order Cancelled'},
    Approve: {code: 6, text: 'Order Approved'}
};

/*
Delivering: {code: 6, text: 'Order being Delivered'},
    Delivered: {code: 7, text: 'Order Delivered'},
    Backordered: {code: 8, text: 'Order Backordered'},
    Dispute: {code: 9, text: 'Order Disputed'},
    Resolve: {code: 10, text: 'Order Dispute Resolved'},
    PayRequest: {code: 11, text: 'Payment Requested'},
    Authorize: {code: 12, text: 'Payment Approved'},
    Paid: {code: 15, text: 'Payment Processed'},
    Refund: {code: 13, text: 'Order Refund Requested'},
    Refunded: {code: 14, text: 'Order Refunded'}
*/


/**
 * create purchase order
 * @param {io.aeries.art.order.UpsertOrder} purchase
 * @transaction
 */
async function UpsertOrder(purchase) {

    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a buyer.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
        // Throw an error as the current participant is not a buyer.
        throw new Error('Current participant is not a Buyer');
    }

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    var factory = getFactory();
    var NS = 'io.aeries.art.order';
    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Order');
    var purchaseOrder;
    var created=false;
    if(!purchase.orderNumber){
        // Create Order
        var orderId = buyer.companyTicker + '_' + new Date().toISOString();
        purchaseOrder = factory.newResource(NS,'Order', orderId);
    }else{
        // Update Order
        created=true;
        purchaseOrder = await assetRegistry.get(purchase.orderNumber);
	    if(!purchaseOrder) throw new Error("Purchase Order : "+ purchase.orderNumber +" not found !!!");
        if(JSON.parse(purchaseOrder.status).code > 2){
            throw new Error("Order cannot be updated");
        }
    }

    purchaseOrder.items = [];
    purchaseOrder.amount = 0;
    if(purchase.items && purchase.items.length > 0){
        var items = purchase.items;
        for(var i=0; i<items.length;i++){
            var item = factory.newConcept(NS,"Item");

            // Set the data in the concept 'Item'
            item.id = i+1;
            item.description = items[i].description || '';
            item.units = items[i].units || 0;
            item.price = items[i].price || 0;
            purchaseOrder.amount+= item.price;

            purchaseOrder.items.push(item);
        }
    }
    
    purchaseOrder.buyer  = currentParticipant;
    purchaseOrder.seller = purchase.seller || null; // check if the seller is present in the Buyer sellers List
    purchaseOrder.banker = purchase.banker || null;

    if(!created){
        purchaseOrder.created = new Date().toISOString();
        purchaseOrder.statusCode = orderStatus.Created.code;
        purchaseOrder.statusMessage = orderStatus.Created.text;
        await assetRegistry.add(purchaseOrder);
    }else {
        purchaseOrder.updated = new Date().toISOString();
        purchaseOrder.status = JSON.stringify(orderStatus.Updated);
        await assetRegistry.update(purchaseOrder);
    }
}

/**
 * Record a request to purchase
 * @param {io.aeries.art.order.SubmitOrder} purchase
 * @transaction
 */
async function SubmitOrder(purchase) {
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a buyer.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
        // Throw an error as the current participant is not a buyer.
        throw new Error('Current participant is not a Buyer');
    }

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    var factory = getFactory();
    var NS = 'io.aeries.art.order';
    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Order');
	
    var purchaseOrder = await assetRegistry.get(purchase.orderNumber);
    if(!purchaseOrder) throw new Error("Purchase Order : "+ purchase.orderNumber +" not found !!!");
    if(purchaseOrder.statusCode > 3 ){
        throw new Error("Order already Purchased");
    }

    purchaseOrder.items = [];
    purchaseOrder.amount = 0;

    if(purchase.items && purchase.items.length > 0){
        var items = purchase.items;
        for(var i=0; i<items.length;i++){
            var item = factory.newConcept(NS,"Item");

            // Set the data in the concept 'Item'
            item.id = i+1;
            item.description = items[i].description || '';
            item.units = items[i].units || 0;
            item.price = items[i].price || 0;
            purchaseOrder.amount+= item.price;

            purchaseOrder.items.push(item);
        }
    }
    
    purchaseOrder.buyer  = currentParticipant;
    purchaseOrder.seller = purchase.seller || null; // check if the seller is present in the Buyer sellers List
    purchaseOrder.banker = purchase.banker || null;

    purchaseOrder.updated = new Date().toISOString();
    purchaseOrder.statusCode = orderStatus.Bought.code;
    purchaseOrder.statusMessage = orderStatus.Bought.text;

    await assetRegistry.update(purchaseOrder);
}

/**
 * Record a request to cancel an order
 * @param {io.aeries.art.order.CancelOrder} purchase
 * @transaction
 */
async function CancelOrder(purchase) {
        var currentParticipant = getCurrentParticipant();

        // Check to see if the current participant is a buyer.
        if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
            // Throw an error as the current participant is not a buyer.
            throw new Error('Current participant is not a Buyer');
        }
    
        var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
        var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
        //if(!buyer.verified){ // verfication must be done by buyer
        //	throw new Error("Buyer not verified");
        //}
    
        var factory = getFactory();
        var NS = 'io.aeries.art.order';
        const assetRegistry = await getAssetRegistry('io.aeries.art.order.Order');
        
        var purchaseOrder = await assetRegistry.get(purchase.orderNumber);
        if(!purchaseOrder) throw new Error("Purchase Order : "+ purchase.orderNumber +" not found !!!");
        if(purchaseOrder.statusCode != 3){
            throw new Error("Order cannot be Cancelled");
        }
    
        purchaseOrder.cancelled = new Date().toISOString();
        purchaseOrder.statusCode = orderStatus.Cancelled.code;
        purchaseOrder.statusMessage = orderStatus.Cancelled.text;
    
        await assetRegistry.update(purchaseOrder);
}

/**
 * Record a request to approve PO by seller
 * @param {io.aeries.art.order.POApproval} purchase
 * @transaction
 */
async function POApproval(purchase) {
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a seller.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Seller') {
        // Throw an error as the current participant is not a seller.
        throw new Error('Current participant is not a seller');
    }

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}

    var factory = getFactory();
    var NS = 'io.aeries.art.order';
    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Order');
    
    var purchaseOrder = await assetRegistry.get(purchase.orderNumber);
    if(!purchaseOrder) throw new Error("Purchase Order : "+ purchase.orderNumber +" not found !!!");
    if(purchaseOrder.statusCode != 3){
        throw new Error("Order cannot be approved");
    }

    purchaseOrder.requestShipment = new Date().toISOString();
    purchaseOrder.statusCode = orderStatus.Approve.code;
    purchaseOrder.statusMessage = orderStatus.Approve.text;

    await assetRegistry.update(purchaseOrder);
}