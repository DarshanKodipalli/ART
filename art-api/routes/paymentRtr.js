var paymentController = require('../controllers/paymentCtrl');

module.exports = function (router, requireLogin) {
	
  router.post('/payments', requireLogin, paymentController.createPayment);
  router.get('/payments', requireLogin, paymentController.getAllPayments);

  router.post('/payments/:id/approve', requireLogin, paymentController.approvePayment);
    router.post("/view/payment", requireLogin, paymentController.viewPayment)  
  router.post("/view/buyerpayment", requireLogin, paymentController.viewPaymentBuyer)  
    router.post('/searchPayments',requireLogin, paymentController.searchForPayments);
  return router;
};