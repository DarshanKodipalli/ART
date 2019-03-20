var userController = require('../controllers/userCtrl');

module.exports = function (router, requireLogin) {
  
  // In signup attach checker too. Now the checker has to be created before maker.
  router.post('/signup', userController.signup);
  router.post('/login', userController.login);

  router.get('/users/me', requireLogin, userController.getUser);
  router.put('/users/me', requireLogin, userController.updateUser);

  router.get('/users', requireLogin, userController.getUsers);
  router.get('/users/:id', requireLogin, userController.getUnverifiedUserByEmail);

  router.post('/users/me/password', requireLogin, userController.updatePassword); // check if its already has a kyc


  router.post('/users/me/kyc', requireLogin, userController.upsertKyc); // check if its already has a kyc

  // Individual approve and bulkapprove
  router.post('/users/approve/:id', requireLogin, userController.approveUser);

  // get buyer, banker relations
  // Buyer or seller
  router.get('/users/me/tags', requireLogin, userController.getTags);
  // fetch stored tags
  router.get('/users/tags', requireLogin, userController.getUserTags);
  // update tags
  router.post('/users/tags', requireLogin, userController.updateUserTags);
  // get user details apart from added ones
  router.get('/users/tagfilter', requireLogin, userController.getFilteredUsers);


  //router.post('/users/approve', requireLogin, userController.approveBulkUser);

  //router.get('/mail', userController.sendMail);
  // /users

  return router;
};