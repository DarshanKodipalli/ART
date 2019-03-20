'use strict';

var paymentStatus = {
    Created: {code: 201, text: 'Payment Created'},
    Updated: {code: 202, text: 'Payment Updated'},
    Cancelled: {code: 203, text: 'Payment Cancelled'},
    Refunded: {code: 204, text: 'Payment Refunded'},
    SellerApproved: {code: 205, text: 'Seller\'s Payment Approved'},
    BankerApproved: {code: 206, text: 'Banker\'s Payment Approved'}
};

/**
 * create payment
 * @param {io.aeries.art.payment.UpsertPayment} payment
 * @transaction
 */
async function UpsertPayment(payment) {

    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a either buyer or banker who can initiate the payment
    var role = '';
    var isValidParticipant = false;
    var userParticipantRegistry ;
    var user;
    if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Banker'){
        isValidParticipant = true;
        role = 'banker';
        userParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Banker');
    } else if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Buyer'){
        isValidParticipant = true;
        role = 'buyer';
        userParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    }

    user = await userParticipantRegistry.get(currentParticipant.getIdentifier());

    // Banker -> Seller || Buyer --> Banker
    if (!isValidParticipant) {
        // Throw an error as the current participant is not a either banker/buyer.
        throw new Error('Current participant is not a valid. Please contact Admin');
    }

    // check for verification of participants in the registry based on the role
    //var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    //var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}

    var factory = getFactory();
    var NS = 'io.aeries.art.payment';
    const assetRegistry = await getAssetRegistry(NS+'.Payment');
    var paymentOrder;
    var updated=false;
    //if(!payment.paymentNumber){
        // Create Invoice
    var paymentId = '';
    paymentId = user.companyTicker + '_' + new Date().toISOString();
    paymentOrder = factory.newResource(NS,'Payment', paymentId);
    /*}else{
        // Update Invoice
        updated=true;
        invoiceOrder = await assetRegistry.get(invoice.invoiceNumber);
	    if(!invoiceOrder) throw new Error("Invoice : "+ invoice.invoiceNumber +" not found !!!");
        if(invoiceOrder.statusCode > 102){
            throw new Error("Invoice cannot be updated");
        }
    */
        // check for valid orderNumber if it exists in Order Asset
    paymentOrder.amount = payment.amount || '0';
    paymentOrder.utrNumber = payment.utrNumber || '';
    paymentOrder.id = payment.id || '';
    paymentOrder.invoiceNumber = payment.invoiceNumber || ''; // ) means empty
    paymentOrder.orderNumber = payment.orderNumber || '';
    // check if sellers/buyers are from their respective lists
    if(role == 'banker'){
        paymentOrder.intent = 'banker-seller';
        paymentOrder.banker = currentParticipant;
        paymentOrder.seller = payment.seller || null;
    }else if(role == 'buyer'){
        paymentOrder.intent = 'buyer-banker';
        paymentOrder.buyer = currentParticipant;
        paymentOrder.banker = payment.banker || null;
    }

    if(!updated){
        paymentOrder.created = new Date().toISOString();
        paymentOrder.statusCode = paymentStatus.Created.code;
        paymentOrder.statusMessage = paymentStatus.Created.text;
        await assetRegistry.add(paymentOrder);
    }else {
        paymentOrder.updated = new Date().toISOString();
        paymentOrder.statusCode = paymentStatus.Updated.code;
        paymentOrder.statusMessage = paymentStatus.Updated.text;
        
        await assetRegistry.update(paymentOrder);
    }
}


/**
 * Record a request to payment
 * @param {io.aeries.art.payment.PaymentApproval} payment
 * @transaction
 */
async function PaymentApproval(payment) {

    // On payment approval check if the complete dueamount is payed till now.

    // preconditions for paticipants before performing approval process based on the stage of process.
    var currentParticipant = getCurrentParticipant();

    // Check to see if the current participant is a either buyer or banker who can initiate the payment
    var role = '';
    var isValidParticipant = false;
    if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Banker'){
        isValidParticipant = true;
        role = 'banker';
    } else if(currentParticipant.getFullyQualifiedType() == 'io.aeries.art.participant.Seller'){
        isValidParticipant = true;
        role = 'seller';
    }

    // Seller for Banker || Banker for buyer transactions
    if (!isValidParticipant) {
        // Throw an error as the current participant is not a either banker/buyer.
        throw new Error('Current participant is not a valid. Please contact Admin');
    }

    // reduce maxlimit for buyer and seller

    // check for verification of participants in the registry based on the role
    //var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    //var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}

    var NS = 'io.aeries.art.payment';
    const assetRegistry = await getAssetRegistry(NS+'.Payment');
    const invoiceAssetRegistry = await getAssetRegistry('io.aeries.art.order.Invoice');
	
    var paymentOrder = await assetRegistry.get(payment.paymentNumber);
    if(!paymentOrder) throw new Error("Payment Order : "+ payment.paymentNumber +" not found !!!");
    if(role == 'seller'){
        if(paymentOrder.statusCode >= paymentStatus.SellerApproved.code ){
            throw new Error("Payment already Approved"); // change logic based on business requirement
        }
    }else if(role == 'banker'){
        if(paymentOrder.statusCode >= paymentStatus.BankerApproved.code ){
            throw new Error("Payment already Approved"); // change logic based on business requirement
        }
    }

    var invoiceNumber = paymentOrder.invoiceNumber;
    var invoice = await invoiceAssetRegistry.get(invoiceNumber);

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    var seller = await sellerParticipantRegistry.get(invoice.seller.getIdentifier());
    if(!seller){
        throw new Error("Seller not present");
    }
    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(invoice.buyer.getIdentifier());
    if(!buyer){
        throw new Error("Buyer not present");
    }

    if(role == 'seller'){   
        // amount paid.. amount left.. totalamount check. if done. close status
        paymentOrder.sellerApproved = new Date().toISOString();
        paymentOrder.statusCode = paymentStatus.SellerApproved.code;
        paymentOrder.statusMessage = paymentStatus.SellerApproved.text;
        
        buyer.maxlimit = payment.buyerAmount;
        seller.maxlimit = payment.sellerAmount;
        invoice.sellerPaymentStatus = payment.paymentStatus;
        invoice.bankerAmountPaidToSeller = payment.paymentAmount;
    } else if(role == 'banker'){
        paymentOrder.bankerApproved = new Date().toISOString();
        paymentOrder.statusCode = paymentStatus.BankerApproved.code;
        paymentOrder.statusMessage = paymentStatus.BankerApproved.text;

        buyer.maxlimit = payment.buyerAmount;
        seller.maxlimit = payment.sellerAmount;
        invoice.bankerPaymentStatus = payment.paymentStatus;
        invoice.buyerAmountPaidToBanker = payment.paymentAmount;
    }
    await buyerParticipantRegistry.update(buyer);
    await sellerParticipantRegistry.update(seller);
    await invoiceAssetRegistry.update(invoice);

    await assetRegistry.update(paymentOrder);
}