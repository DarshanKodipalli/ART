var crypto = require('crypto');
var config = require('../config/sysProp');

exports.orderStatus = { // same as chaincode
    Created: {code: 1, text: 'Order Created'},
    Updated: {code: 2, text: 'Order Updated'},
    Submit: {code: 3, text: 'Order Submitted'},
    Cancelled: {code: 4, text: 'Order Cancelled'},
    RejectApproval: {code: 5, text: 'Order Approval Rejected'},
    Approve: {code: 6, text: 'Order Approved'}
};

exports.invoiceStatus = {
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

exports.paymentStatus = {
    Created: {code: 201, text: 'Payment Created'},
    Updated: {code: 202, text: 'Payment Updated'},
    Cancelled: {code: 203, text: 'Payment Cancelled'},
    Refunded: {code: 204, text: 'Payment Refunded'},
    SellerApproved: {code: 205, text: "Seller's Payment Approved"},
    BankerApproved: {code: 206, text: "Banker's Payment Approved"}

};


exports.encrypt = function(item, type) {
    if(!(type == 'invoice' || type == 'order' || type == 'payment')){
        throw new error("Not valid Type");
    }
    let iv = crypto.randomBytes(config.crypto.ivlength);
    // generate a salt
    //let cipher = crypto.createCipheriv(config.crypto.algo, config.crypto.key);
    let cipher =  crypto.createCipheriv(config.crypto.algo, new Buffer(config.crypto.key), iv);
    // loop through configured items
    var encryptItems = [];

    encryptItems = config.assetencrypt[type];

    console.log("encryptItems:"+JSON.stringify(encryptItems));
    var encrypted;
    encryptItems.forEach(element => {
        console.log(element+'--'+item[element]);
        encrypted = cipher.update(item[element]+'');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        item[element] = iv.toString('hex') + ':' + encrypted.toString('hex');
    });
}

exports.decrypt = function(records, type) {
    if(!(type == 'invoice' || type == 'order' || type == 'payment')){
        throw new error("Not valid Type");
    }
    //let decipher = crypto.createDecipheriv(config.crypto.algo, config.crypto.key);
    let textParts,iv,encryptedText,decipher,decrypted;
    var encryptItems = [];

    encryptItems = config.assetencrypt[type];

    return records.map(function(item){
        encryptItems.forEach(element => {
            textParts = item[element].split(':');
            iv = new Buffer(textParts.shift(), 'hex');
            encryptedText = new Buffer(textParts.join(':'), 'hex');
            decipher = crypto.createDecipheriv(config.crypto.algo, new Buffer(config.crypto.key), iv);
            decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            item[element] = decrypted.toString();
        });
    });
}

exports.decryptItem = function(item, type) {
    if(!(type == 'invoice' || type == 'order' || type == 'payment')){
        throw new error("Not valid Type");
    }
    //let decipher = crypto.createDecipher(config.crypto.algo, config.crypto.key);
    let textParts,iv,encryptedText,decipher,decrypted;
    var encryptItems = [];

    encryptItems = config.assetencrypt[type];
    
    encryptItems.forEach(element => {
        textParts = item[element].split(':');
        iv = new Buffer(textParts.shift(), 'hex');
        encryptedText = new Buffer(textParts.join(':'), 'hex');
        decipher = crypto.createDecipheriv(config.crypto.algo, new Buffer(config.crypto.key), iv);
        decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        item[element] = decrypted.toString();
    });
}