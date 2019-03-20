var invoiceController = require('../controllers/invoiceCtrl');

module.exports = function (router, requireLogin) {

  router.post('/invoices/carts', requireLogin, invoiceController.createInvoice);
  router.put('/invoices/carts/:id', requireLogin, invoiceController.updateInvoice);
  router.post('/invoices', requireLogin, invoiceController.submitInvoice);

  router.post('/invoices/:id/approvechecker', requireLogin, invoiceController.approveInvoiceByChecker);

  router.put('/invoices/:id/cancel', requireLogin, invoiceController.cancelInvoice);

  router.post('/invoices/:id/approve', requireLogin, invoiceController.approveInvoice);
  router.post('/invoices/:id/rejectapproval', requireLogin, invoiceController.rejectApproveInvoice);

  // proposing the Invoice to banker by buyer or seller
  router.post('/invoices/:id/propose', requireLogin, invoiceController.proposeInvoice);
  router.post('/invoices/:id/acceptproposal', requireLogin, invoiceController.acceptProposeInvoice);
  router.post('/invoices/:id/rejectproposal', requireLogin, invoiceController.rejectProposeInvoice);

  router.get('/invoices', requireLogin, invoiceController.getAllInvoices);
  router.get('/invoices/carts', requireLogin, invoiceController.getAllCartInvoices);
  router.post("/view/invoice", requireLogin, invoiceController.viewInvoice);
  router.post('/searchInvoices',requireLogin, invoiceController.searchForInvoices);
  router.post("/view/invoicesignedinvoice",requireLogin,invoiceController.invoiceSignedInvoice)
  // Bulk functions

  /*
  router.post('/invoices/carts/bulkUpload', requireLogin, invoiceController.createBulkInvoice);
  router.post('/invoices/bulkUpload', requireLogin, invoiceController.submitBulkInvoice);

  router.post('/invoices/bulkApprove', requireLogin, invoiceController.approveBulkInvoice);
  router.post('/invoices/bulkPropose', requireLogin, invoiceController.proposeBulkInvoice);
  */
  
  return router;
};