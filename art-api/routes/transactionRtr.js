var transactionController = require('../controllers/transactionCtrl');

module.exports = function (router, requireLogin) {

  router.get('/transactions', requireLogin, transactionController.getAllTransactions);

  router.get('/transactions/:id', requireLogin, transactionController.getAssetHistorianTransactionById);
  
  router.get('/transactions/assets/:id', requireLogin, transactionController.getAllAssetLogsById);
  
  return router;
};