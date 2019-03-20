var bulkUploadController = require('../controllers/bulkUploadCtrl');

module.exports = function (router, requireLogin) {

  router.get('/carts/bulk', requireLogin, bulkUploadController.getBulkUploads);
  router.post('/carts/bulk', requireLogin, bulkUploadController.createBulkUploads);
  
  return router;
};
