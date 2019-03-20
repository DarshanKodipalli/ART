'use strict';


/**
 * create participant
 * @param {io.aeries.art.participant.UpsertBuyer} user
 * @transaction
 */
async function UpsertBuyer(user) {

    var currentParticipant = getCurrentParticipant();

    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer') {
        throw new Error('Current participant is not a Buyer');
    }

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    var buyer = await buyerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!buyer.verified){
    //	throw new Error("Buyer not verified");
    //}

    buyer.firstName = user.firstName;
    buyer.middleName = user.middleName;
    buyer.lastName = user.lastName;
    buyer.companyName = user.companyName;
    buyer.companyTicker = user.companyTicker;
    buyer.cinNumber = user.cinNumber;
    buyer.addressLine1 = user.addressLine1;
    buyer.addressLine2 = user.addressLine2;
    buyer.addressLine3 = user.addressLine3;

    //buyer.buyer  = currentParticipant;
    //buyer.banker = user.banker || null;
    await buyerParticipantRegistry.update(buyer);
}

/**
 * create participant
 * @param {io.aeries.art.participant.UpsertSeller} user
 * @transaction
 */
async function UpsertSeller(user) {

    var currentParticipant = getCurrentParticipant();

    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Seller') {
        throw new Error('Current participant is not a Seller');
    }

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}

    seller.firstName = user.firstName;
    seller.middleName = user.middleName;
    seller.lastName = user.lastName;
    seller.companyName = user.companyName;
    seller.companyTicker = user.companyTicker;
    seller.cinNumber = user.cinNumber;
    seller.addressLine1 = user.addressLine1;
    seller.addressLine2 = user.addressLine2;
    seller.addressLine3 = user.addressLine3;

    //seller.seller  = currentParticipant;
    //seller.banker = user.banker || null;
    await sellerParticipantRegistry.update(seller);
}

// Currently only used for seller
/**
 * create Kyc
 * @param {io.aeries.art.participant.UpsertKyc} kycData 
 * @transaction
 */
async function UpsertKyc(kycData) {

    var currentParticipant = getCurrentParticipant();
    var role = '';
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Seller') {
        role = 'seller';
    }else if(currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Buyer'){
        role = 'buyer';
    }else {
        throw new Error("Please contact Admin");
    }
    var participantRegistry;
    if(role == 'seller'){
        participantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
        //var seller = await sellerParticipantRegistry.get(currentParticipant.getIdentifier());
    }else if(role == 'buyer'){
        participantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    }
    
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}
    var factory = getFactory();
    var updated = false;
    var NS = 'io.aeries.art.participant';
    var kycDetails;
    var kycAssetRegistry = await getAssetRegistry('io.aeries.art.participant.Kyc');
    if(!kycData.kycID){
        // Create Order
        var kycID = 'KYC_' + new Date().toISOString();
        kycDetails = factory.newResource(NS,'Kyc', kycID);
    }else{
        // Update Order
        updated=true;
        kycDetails = await kycAssetRegistry.get(kycData.kycID);
        if(!kycDetails) throw new Error("KYC Details : "+ kycData.kycID +" not found !!!");
        
    }

    kycDetails.id = kycData.id || '';
    kycDetails.aadhaarCardNumber = kycData.aadhaarCardNumber;
    kycDetails.panCardNumber = kycData.panCardNumber;
    kycDetails.cinNumber = kycData.cinNumber;
    kycDetails.document1Hash = kycData.document1Hash;
    kycDetails.document2Hash = kycData.document2Hash;

    if( role == 'seller'){
        kycDetails.seller  = currentParticipant;
    }else if(role == 'buyer'){
        kycDetails.buyer  = currentParticipant;
    }
    
    kycDetails.banker = kycData.banker || null;
    if(updated){
        await kycAssetRegistry.update(kycDetails);
    }else{
        await kycAssetRegistry.add(kycDetails);
    }
    
}



/**
 * Approving Buyer
 * @param {io.aeries.art.participant.ApproveBuyer} buyer
 * @transaction
 */
async function ApproveBuyer(buyer) {

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker') {
        throw new Error("User is not Banker");
    }  
    var bankerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Banker');
    var banker = await bankerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}
    var NS = 'io.aeries.art.participant';

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Buyer');
    // check if buyerId exists
    var buyerData = await buyerParticipantRegistry.get(buyer.buyer.getIdentifier());
    if(buyerData){
        buyerData.verifiedUser = true;
        buyerData.maxlimit = buyer.maxlimit;
    }else{
        throw new Error("Please check buyer details");
    }

    await buyerParticipantRegistry.update(buyerData);

}

/**
 * Approving Seller
 * @param {io.aeries.art.participant.ApproveSeller} seller
 * @transaction
 */
async function ApproveSeller(seller) {

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker') {
        throw new Error("User is not Banker");
    }  
    var bankerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Banker');
    var banker = await bankerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}
    var NS = 'io.aeries.art.participant';

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Seller');
    // check if sellerId exists
    var sellerData = await sellerParticipantRegistry.get(seller.seller.getIdentifier());
    if(sellerData){
        sellerData.verifiedUser = true;
        sellerData.maxlimit = seller.maxlimit;
    }else{
        throw new Error("Please check seller details");
    }

    await sellerParticipantRegistry.update(sellerData);
    
}

/**
 * Approving Buyer
 * @param {io.aeries.art.participant.ApproveBuyerChecker} buyer
 * @transaction
 */
async function ApproveBuyerChecker(buyer) {

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker') {
        throw new Error("User is not Banker");
    }  
    var bankerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Banker');
    var banker = await bankerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}
    var NS = 'io.aeries.art.participant';

    var buyerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.BuyerChecker');
    // check if buyerId exists
    var buyerData = await buyerParticipantRegistry.get(buyer.buyerchecker.getIdentifier());
    if(buyerData){
        buyerData.verifiedUser = true;
        buyerData.maxlimit = buyer.maxlimit;
    }else{
        throw new Error("Please check buyer details");
    }

    await buyerParticipantRegistry.update(buyerData);

}

/**
 * Approving Seller
 * @param {io.aeries.art.participant.ApproveSellerChecker} seller
 * @transaction
 */
async function ApproveSellerChecker(seller) {

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getFullyQualifiedType() !== 'io.aeries.art.participant.Banker') {
        throw new Error("User is not Banker");
    }  
    var bankerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.Banker');
    var banker = await bankerParticipantRegistry.get(currentParticipant.getIdentifier());
    //if(!seller.verified){
    //	throw new Error("Seller not verified");
    //}
    var NS = 'io.aeries.art.participant';

    var sellerParticipantRegistry = await getParticipantRegistry('io.aeries.art.participant.SellerChecker');
    // check if sellerId exists
    var sellerData = await sellerParticipantRegistry.get(seller.sellerchecker.getIdentifier());
    if(sellerData){
        sellerData.verifiedUser = true;
        sellerData.maxlimit = seller.maxlimit;
    }else{
        throw new Error("Please check seller details");
    }

    await sellerParticipantRegistry.update(sellerData);
    
}