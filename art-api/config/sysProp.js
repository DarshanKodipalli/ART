module.exports = {
  'secret'	: 'iourwqkljlfkjaf98430598lkj!@@*f]',
  'database': 'mongodb://darshan_k:darshan_k7@ds161950.mlab.com:61950/testwallet',
/*  'database': 'mongodb://pravn1729:pravn1729@ds137281.mlab.com:37281/testwallet',*/
  'port' 	: process.env.PORT || "3000",
  'version'	: 'v1',
  'batchLength': 30,
  'reportTemplates':{
    'order': 'HyN6hbo2Q',
    'invoice': 'Hyuo0un2Q'
  },
  'smtp':{
    'gmail':{
      'user':'notification@ledgerium.net',
      'password':'ionic-ken-finite-ajax-degum-byword'
    }
  },
  'orderDependencyEnabled': true, // TRUE, if invoice is linked to order asset
  'banker':'banker1@aeries.io',
  'makerCheckerEnabled': true,
  'dataEncryptionEnabled': true,
  'crypto': {
    'algo': 'aes-256-cbc',
    'key': 'Nv9FglGxMqIqUixB5BdKS$^sUk!ImM85', //has to be 32 Characters
    'ivlength': 16 // for aes this is alway 16
  },
  'assetencrypt': {
    'user':['maxlimit'],
    'order':['amount'],
    'invoice':['amount'],
    'payment':['utrNumber']}
};