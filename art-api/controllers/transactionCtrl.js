var TransactionLog = require('../models/transaction');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

exports.transactioncheckerlog = async function(assetId, assetName, action, description, user, 
    role, buyer, seller, banker, buyerchecker, sellerchecker, transactionId){
    try{
        var log = new TransactionLog();

        log.assetId = assetId;
        log.assetName = assetName;
        log.action = action;
        log.user = user;
        log.role = role;
        log.buyer = buyer;
        log.seller = seller;
        log.banker = banker;
        log.transactionId = transactionId;
        log.description = description;
        console.log(transactionId)
        console.log(log)        
        await log.save();
        console.log("Logged the transaction");
    }catch(error){
        console.log(error);
    }
};

exports.transactionlog = async function(assetId, assetName, action, description, user, 
    role, buyer, seller, banker, transactionId){
    try{
        var log = new TransactionLog();

        log.assetId = assetId;
        log.assetName = assetName;
        log.action = action;
        log.user = user;
        log.role = role;
        log.buyer = buyer;
        log.seller = seller;
        log.banker = banker;
        log.transactionId = transactionId;
        log.description = description;
        console.log(transactionId)
        console.log(log)

        await log.save();
        console.log("Logged the transaction");
    }catch(error){
        console.log(error);
    }
};

//   GET /transactions/assets/:id
exports.getAllAssetLogsById = async function(req, res){
    // validations for inputs
    try{
        var assetId  = req.params.id || '';
        var user = req.session.user.email || '';
        var role = req.session.user.role || '';
        var input = {assetId: assetId};
        if(role == 'buyer'){
            input.buyer = user;
        }else if(role == 'seller'){
            input.seller = user;
        }else if(role == 'banker'){
            input.banker = user;
        }else if(role == 'sellerchecker'){
            input.sellerchecker = user;
        }else if(role == 'buyerchecker'){
            input.buyerchecker = user;
        }

        if(user){
            var transactions = await TransactionLog.find(input);
            return res.json({success: true, data: transactions });
        }
        res.json({success: false, error: 'Please contact admin' });
    } catch(err){
        console.log(err);
        return res.json({ success: false, message: 'Problem while fetching results'});
    }
};

//   GET /transactions
exports.getAllTransactions = async function(req, res){
    // validations for inputs
    try{
        var user = req.session.user.email || '';
        if(user){
            var transactions = await getHistorianRecords(user);
          return  res.json({success: true, data: transactions });
        }
      return  res.json({success: false, error: 'Please contact admin' });
        
    } catch(err){
        console.log(err);
       return res.json({ success: fail, message: 'Problem while fetching results'});
    }
};

// GET /transactions/:id?action=actionName
exports.getAssetHistorianTransactionById = async function(req, res){
    // validations for inputs
    
    try{
        var transactionId  = req.params.id || '';
        var action = req.query.action || '';
        console.log(transactionId+"-"+action)
        var role = req.session.user.role;
        var email = req.session.user.email || '';

        var result = await getAssetByTransactionIdHistorianRecords(email, transactionId, action);

        console.log(JSON.stringify(result));

      return  res.json({success: true, data: result });
        
    } catch(err){
        console.log(err);
      return  res.json({ success: fail, message: 'Problem while fetching results'});
    }
};

/*
 * Blockchain Functions
 */

async function getHistorianRecords(cardName){
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' Historian Records');
		return await businessNetworkConnection.query('selectHistorianRecords');
	}catch(err){
		console.log(error);
	}
}

async function getAssetByTransactionIdHistorianRecords(cardName, transactionId, action){
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
        console.log('Getting '+action+' method : '+cardName+' Historian Asset Records by transaction id');
        
        var selectorFunction='UpsertOrder';

        var input = {transactionId: transactionId };

        if(action == 'UpsertOrder'){
            selectorFunction = 'selectAssetInUpsertOrderByTransactionId';
        } else if(action == 'SubmitOrder'){
            selectorFunction = 'selectAssetInSubmitOrderByTransactionId';
        } else if(action == 'POApproval'){
            selectorFunction = 'selectAssetInPOApprovalByTransactionId';
        } else if(action == 'UpsertInvoice'){
            selectorFunction = 'selectAssetInUpsertInvoiceByTransactionId';
        } else if(action == 'SubmitInvoice'){
            selectorFunction = 'selectAssetInSubmitInvoiceByTransactionId';
        } else if(action == 'InvoiceApproval'){
            selectorFunction = 'selectAssetInInvoiceApprovalByTransactionId';
        } else if(action == 'UpsertPayment'){
            selectorFunction = 'selectAssetInUpsertPaymentByTransactionId';
        } else if(action == 'PaymentApproval'){
            selectorFunction = 'selectAssetInPaymentApprovalByTransactionId';
        }

		return await businessNetworkConnection.query(selectorFunction, input);
	}catch(err){
		console.log(error);
	}
}
