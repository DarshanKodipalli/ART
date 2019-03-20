var orderController = require('../controllers/orderCtrl');

module.exports = function (router, requireLogin) {

  router.post('/orders/carts', requireLogin, orderController.createOrder);
  router.put('/orders/carts/:id', requireLogin, orderController.updateOrder);
  router.post('/orders', requireLogin, orderController.submitOrder);
  router.put('/orders/:id/cancel', requireLogin, orderController.cancelOrder);

  router.post('/orders/:id/approve', requireLogin, orderController.approveOrder);
  router.post('/orders/:id/rejectapproval', requireLogin, orderController.rejectApproveOrder);

  //router.get('/orders/carts', requireLogin, orderController.getAllCartOrders);
  router.get('/orders', requireLogin, orderController.getAllOrders);
  router.get('/orders/:orderNumber', requireLogin, orderController.getOrderById);
  router.post('/searchOrders',requireLogin, orderController.searchForOrders);
  // Bulk Uploads

  //router.post('/orders/carts/bulkUpload', requireLogin, invoiceController.createBulkOrder);
  //router.post('/orders/bulkUpload', requireLogin, invoiceController.submitBulkOrder);
  
  return router;
};
