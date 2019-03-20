var mongoose = require('mongoose');
var transactionLogSchema = new mongoose.Schema({
    assetId : { type : String},
    assetName: { type : String },
    action : { type : String },
    description : { type : String },
    user : { type : String },
    role : { type : String },
    buyer : { type : String },
    seller : { type : String },
    banker : { type : String },
    buyerchecker: { type : String },
    sellerchecker: { type : String },
    transactionId : { type : String }
});

// AssetId is unique id of asset
module.exports = mongoose.model('TransactionLog', transactionLogSchema);