'use strict';

var invoiceStatus = {
	Created: { code: 101, text: 'Invoice Created' },
	Updated: { code: 102, text: 'Invoice Updated' },
	Submit: { code: 103, text: 'Invoice Submitted' },
	ApproveChecker: { code: 104, text: 'Invoice Approved Checker' },
	Cancelled: { code: 105, text: 'Invoice Cancelled' },
	RejectApproval: { code: 106, text: 'Invoice Approval Rejected' },
	Approve: { code: 107, text: 'Invoice Approved' },
	Propose: { code: 108, text: 'Invoice Proposed' },
	AcceptProposal: { code: 109, text: 'Accept Invoice Proposal' },
	RejectProposal: { code: 110, text: 'Reject Invoice Proposal' }
};

/**
 * create invoice
 * @param {io.aeries.art.order.UpsertInvoice} invoice
 * @transaction
 */
async function UpsertInvoice(invoice) {

    // check order dependency status if enabled
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
        // Update Invoice
        created=true;
        invoiceOrder = await assetRegistry.get(invoice.invoiceNumber);
	    if(!invoiceOrder) throw new Error("Invoice : "+ invoice.invoiceNumber +" not found !!!");
        if(invoiceOrder.statusCode > invoiceStatus.Updated.code){
            throw new Error("Invoice cannot be updated");
        }

        // check for valid orderNumber if it exists in Order Asset
    }

    if(invoice.checkerDependency){
        invoiceOrder.buyerChecker = invoice.buyerChecker || null;
        invoiceOrder.sellerChecker = invoice.sellerChecker || null;
    }
    
    invoiceOrder.id = invoice.id || '';
    invoiceOrder.invoiceDescription = invoice.invoiceDescription || '';
    invoiceOrder.amount = invoice.amount || '0';
    invoiceOrder.orderNumber = invoice.orderNumber || ''; // ) means empty
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
        invoiceOrder.statusCode = invoiceStatus.Updated.code;
        invoiceOrder.statusMessage = invoiceStatus.Updated.text;
        
        await assetRegistry.update(invoiceOrder);
    }
}


/**
 * Record a request to invoice
 * @param {io.aeries.art.order.SubmitInvoice} invoice
 * @transaction
 */
async function SubmitInvoice(invoice) {
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

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
	
    var invoiceOrder = await assetRegistry.get(invoice.invoiceNumber);
    if(!invoiceOrder) throw new Error("Purchase Invoice : "+ invoiceOrder.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode > invoiceStatus.Submit.code ){
        throw new Error("Invoice already Purchased"); // change logic based on business requirement
    }

    if(invoice.checkerDependency){
        invoiceOrder.buyerChecker = invoice.buyerChecker || null;
        invoiceOrder.sellerChecker = invoice.sellerChecker || null;
    }
    
    invoiceOrder.id = invoice.id || '';
    invoiceOrder.invoiceDescription = invoice.invoiceDescription || '';
    invoiceOrder.amount = invoice.amount || '0';
    invoiceOrder.orderNumber = invoice.orderNumber || ''; // ) means empty
    invoiceOrder.seller  = currentParticipant;
    invoiceOrder.buyer = invoice.buyer || null; // check if the buyer is present in the Seller buyers List
    invoiceOrder.banker = invoice.banker || null;

    invoiceOrder.updated = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.Submit.code;
    invoiceOrder.statusMessage = invoiceStatus.Submit.text;

    await assetRegistry.update(invoiceOrder);
}

/**
 * Record a request to cancel an invoice
 * @param {io.aeries.art.order.CancelInvoice} purchase
 * @transaction
 */
async function CancelInvoice(purchase) {
        var currentParticipant = getCurrentParticipant();

        // Check to see if the current participant is a seller.
        if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Seller') {
            // Throw an error as the current participant is not a seller.
            throw new Error('Current participant is not a Seller');
        }
    
        var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
        var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
        //if(!seller.verified){ // verfication must be done by seller
        //	throw new Error("Seller not verified");
        //}
    
        const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
        
        var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
        if(!invoiceOrder) throw new Error("Invoice : "+ purchase.invoiceNumber +" not found !!!");
        if(invoiceOrder.statusCode != invoiceStatus.Submit.code){
            throw new Error("Invoice cannot be Cancelled");
        }
    
        invoiceOrder.message = invoiceStatus.message;
        invoiceOrder.cancelled = new Date().toISOString();
        invoiceOrder.statusCode = invoiceStatus.Cancelled.code;
        invoiceOrder.statusMessage = invoiceStatus.Cancelled.text;
    
        await assetRegistry.update(invoiceOrder);
}

/**
 * Record a request to reject Invoice by Buyer
 * @param {io.aeries.art.order.RejectInvoiceApproval} purchase
 * @transaction
 */
async function RejectInvoiceApproval(purchase) {
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a buyer.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
        // Throw an error as the current participant is not a buyer.
        throw new Error('Current participant is not a buyer');
    }

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode != invoiceStatus.Submit.code){ // change the logic based on business requirement
        throw new Error("Invoice Order cannot be approved");
    }

    invoiceOrder.rejectProposal = new Date().toISOString();
    invoiceOrder.rejectProposalReason = purchase.rejectProposalReason || '';
    invoiceOrder.statusCode = invoiceStatus.RejectApproval.code;
    invoiceOrder.statusMessage = invoiceStatus.RejectApproval.text;

    await assetRegistry.update(invoiceOrder);
}

/**
 * Record a request to approve Invoice by sellerchecker
 * @param {io.aeries.art.order.InvoiceApprovalChecker} purchase
 * @transaction
 */
async function InvoiceApprovalChecker(purchase) {
    if(!purchase.checkerDependency){
        throw new Error('Checker Functionality is not enabled. Please contact Admin');
    }
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a seller checker.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.SellerChecker') {
        // Throw an error as the current participant is not a seller checker.
        throw new Error('Current participant is not a seller checker');
    }

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.SellerChecker');
    var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode != invoiceStatus.Submit.code){ // change the logic based on business requirement
        throw new Error("Invoice Order cannot be approved by checker");
    }

    invoiceOrder.approvedChecker = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.ApproveChecker.code;
    invoiceOrder.statusMessage = invoiceStatus.ApproveChecker.text;

    await assetRegistry.update(invoiceOrder);
}


/**
 * Record a request to approve Invoice by buyer
 * @param {io.aeries.art.order.InvoiceApproval} purchase
 * @transaction
 */
async function InvoiceApproval(purchase) {
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a buyer.
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
        // Throw an error as the current participant is not a buyer.
        throw new Error('Current participant is not a buyer');
    }

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(purchase.checkerDependency){
        if(invoiceOrder.statusCode != invoiceStatus.ApproveChecker.code){ // change the logic based on business requirement
            throw new Error("Invoice Order cannot be approved by checker");
        }
    }else{
        if(invoiceOrder.statusCode != invoiceStatus.Submit.code){ // change the logic based on business requirement
            throw new Error("Invoice Order cannot be approved");
        }
    }

    invoiceOrder.approved = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.Approve.code;
    invoiceOrder.statusMessage = invoiceStatus.Approve.text;

    await assetRegistry.update(invoiceOrder);
}

/**
 * Record a request to proposal Invoice by buyer or seller
 * @param {io.aeries.art.order.InvoiceProposal} purchase
 * @transaction
 */
async function InvoiceProposal(purchase) {
    var currentParticipant = getCurrentParticipant();

    var role;
    if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Buyer'){
        role = 'buyer';
    }else if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Seller'){
        role = 'seller';
    } else {
        throw new Error('Current participant is not a valid participant');
    }

    //var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    //var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode != invoiceStatus.Approve.code){ // change the logic based on business requirement
        throw new Error("Invoice Order cannot be proposed");
    }

    invoiceOrder.proposed = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.Propose.code;
    if(role == 'buyer'){
        invoiceOrder.statusMessage = invoiceStatus.Propose.text+' By Buyer';
    }else if(role == 'seller'){
        invoiceOrder.statusMessage = invoiceStatus.Propose.text+' By Seller';
    }
    
    await assetRegistry.update(invoiceOrder);
}

/**
 * Record a proposal acceptance Invoice by banker
 * @param {io.aeries.art.order.AcceptInvoiceProposal} purchase
 * @transaction
 */
async function AcceptInvoiceProposal(purchase) {
    var currentParticipant = getCurrentParticipant();

    if(currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker'){
        throw new Error('Current participant is not a Banker');
    }

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode != invoiceStatus.Propose.code){ // change the logic based on business requirement
        throw new Error("Invoice Order cannot be accepted");
    }

    invoiceOrder.acceptProposal = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.AcceptProposal.code;
    invoiceOrder.statusMessage = invoiceStatus.AcceptProposal.text;
    
    await assetRegistry.update(invoiceOrder);
}

/**
 * Record a proposal rejection Invoice by banker
 * @param {io.aeries.art.order.RejectInvoiceProposal} purchase
 * @transaction
 */
async function RejectInvoiceProposal(purchase) {
    var currentParticipant = getCurrentParticipant();

    if(currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker'){
        throw new Error('Current participant is not a Banker');
    }

    const assetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
    
    var invoiceOrder = await assetRegistry.get(purchase.invoiceNumber);
    if(!invoiceOrder) throw new Error("Invoice Order : "+ purchase.invoiceNumber +" not found !!!");
    if(invoiceOrder.statusCode != invoiceStatus.Propose.code){ // change the logic based on business requirement
        throw new Error("Invoice Order cannot be rejected");
    }

    invoiceOrder.rejectProposalReason = purchase.rejectProposalReason;
    invoiceOrder.rejectProposal = new Date().toISOString();
    invoiceOrder.statusCode = invoiceStatus.RejectProposal.code;
    invoiceOrder.statusMessage = invoiceStatus.RejectProposal.text;
    
    await assetRegistry.update(invoiceOrder);
}