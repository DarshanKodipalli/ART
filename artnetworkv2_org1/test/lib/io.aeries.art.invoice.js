'use strict';

var invoiceStatus = {
    Created: {code: 101, text: 'Invoice Created'},
    Updated: {code: 102, text: 'Invoice Updated'},
    Submitted: {code: 103, text: 'Invoice Purchased'},
    Correction: {code: 104, text: 'Invoice Correction Required'},
    Cancelled: {code: 105, text: 'Invoice Cancelled'},
    Approve: {code: 106, text: 'Invoice Approved'}
};

/**
 * create invoice
 * @param {io.aeries.art.order.UpsertInvoice} invoice
 * @transaction
 */
async function UpsertInvoice(invoice) {

    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a seller.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Seller') {
        // Throw an error as the current participant is not a seller.
        throw new Error('Current participant is not a Seller');
    }

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}

    var factory = getFactory();
    var NS = 'io.aeries.art.order';
    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    var invoiceOrder;
    var created=false;
    if(!invoice.invoiceNumber){
        // Create Invoice
        var invoiceId = seller.companyTicker + '_' + new Date().toISOString();
        invoiceOrder = factory.newResource(NS,'Invoice', invoiceId);
    }else{
        // Update Order
        created=true;
        invoiceOrder = await assetRegistry.get(invoice.orderNumber);
	    if(!invoiceOrder) throw new Error("Invoice : "+ invoice.orderNumber +" not found !!!");
        if(invoiceOrder.statusCode > 2){
            throw new Error("Invoice cannot be updated");
        }
    }

    invoiceOrder.items = [];
    invoiceOrder.amount = 0;
    if(invoice.items && invoice.items.length > 0){
        var items = invoice.items;
        for(var i=0; i<items.length;i++){
            var item = factory.newConcept(NS,"Item");

            // Set the data in the concept 'Item'
            item.id = i+1;
            item.description = items[i].description || '';
            item.units = items[i].units || 0;
            item.price = items[i].price || 0;
            invoiceOrder.amount+= item.price;

            invoiceOrder.items.push(item);
        }
    }
    
    invoiceOrder.orderNumber = invoice.orderNumber || 0; // ) means empty
    invoiceOrder.seller  = currentParticipant;
    invoiceOrder.buyer = invoice.buyer || null; // check if the buyer is present in the Seller buyers List
    invoiceOrder.banker = invoice.banker || null;

    if(!created){
        invoiceOrder.created = new Date().toISOString();
        invoiceOrder.statusCode = invoiceStatus.Created.code;
        invoiceOrder.statusMessage = invoiceStatus.Created.text;
        await assetRegistry.add(invoiceOrder);
    }else {
        invoiceOrder.updated = new Date().toISOString();
        invoiceOrder.statusCode = orderStatus.Updated.code;
        invoiceOrder.statusMessage = orderStatus.Updated.text;
        
        await assetRegistry.update(invoiceOrder);
    }
}