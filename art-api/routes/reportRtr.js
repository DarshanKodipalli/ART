var reportController = require('../controllers/reportCtrl');

module.exports = function (router, requireLogin) {

  // divide into type of report file: default pdf
  // /report?template=order&id=<orderNumber>
  router.get('/report', reportController.getReport);
  
  return router;
};
